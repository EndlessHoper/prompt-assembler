from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
import logging
import asyncio

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/scrape")
async def scrape_url(url: str):
    try:
        logger.info(f"Starting scrape for URL: {url}")
        
        # Configure browser with longer timeout and wait settings
        browser_config = BrowserConfig(
            headless=True,
            viewport_width=1920,
            viewport_height=1080
        )
        logger.debug("Created browser config")
        
        # Configure crawler with simple markdown settings
        config = CrawlerRunConfig(
            markdown_generator=DefaultMarkdownGenerator(
                options={
                    "ignore_links": False,
                    "escape_html": True,
                    "body_width": 0
                }
            )
        )
        logger.debug("Created crawler config")
        
        # Create crawler instance and fetch content with retry logic
        for attempt in range(3):  # Try up to 3 times
            try:
                async with AsyncWebCrawler(config=browser_config) as crawler:
                    logger.info(f"Starting crawl (attempt {attempt + 1})...")
                    
                    # Add a small delay to ensure page is fully loaded
                    await asyncio.sleep(2)
                    
                    result = await crawler.arun(url, config=config)
                    logger.info(f"Crawl completed. Success: {result.success}")
                    
                    if result.success and result.html:
                        # Log raw HTML for debugging
                        logger.debug(f"Raw HTML length: {len(result.html)}")
                        
                        # Try to get markdown from different result properties
                        markdown = result.markdown
                        if not markdown and hasattr(result, 'raw_markdown'):
                            markdown = result.raw_markdown
                        if not markdown and hasattr(result, 'fit_markdown'):
                            markdown = result.fit_markdown
                        
                        if markdown:
                            logger.info(f"Markdown generated. Length: {len(markdown)}")
                            logger.debug(f"Markdown content preview: {markdown[:200]}...")
                            return {"markdown": markdown}
                            
                    logger.warning(f"Attempt {attempt + 1} failed, retrying...")
                    await asyncio.sleep(1)  # Wait before retry
                    
            except Exception as e:
                logger.error(f"Error in attempt {attempt + 1}: {str(e)}")
                if attempt == 2:  # Last attempt
                    raise
                await asyncio.sleep(1)  # Wait before retry
        
        raise HTTPException(status_code=400, detail="Failed to extract content after multiple attempts")
                
    except Exception as e:
        logger.error(f"Error processing URL: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server...")
    uvicorn.run(app, host="127.0.0.1", port=3000) 