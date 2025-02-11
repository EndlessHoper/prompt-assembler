# URL to Markdown Scraping Service

A simple FastAPI service that fetches web pages and converts them to clean markdown.

## Setup

1. Make sure you have Python 3.8+ installed
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Service

Start the service:
```bash
python scraper.py
```

The service will run on http://localhost:3000

## API Endpoints

### GET /scrape

Fetches a URL and converts it to markdown.

Query parameters:
- `url`: The URL to scrape (required)

Example:
```bash
curl "http://localhost:3000/scrape?url=https://example.com"
```

Response:
```json
{
  "markdown": "# Page Title\n\n## Metadata\n..."
}
```

## Features

- Extracts main content using common selectors
- Removes unwanted elements (scripts, styles, etc.)
- Converts HTML to clean markdown
- Handles errors gracefully
- CORS enabled for frontend integration 