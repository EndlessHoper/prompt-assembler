// URL validation regex
export const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

// Function to generate a filename from URL
export const generateFilenameFromUrl = (url: string): string => {
  const urlObj = new URL(url);
  const basename = urlObj.hostname.replace(/^www\./, '') + urlObj.pathname.replace(/\//g, '-');
  return `${basename}.md`.replace(/[^a-z0-9.-]/gi, '-').toLowerCase();
};

// Function to fetch URL content and convert to markdown
export const fetchUrlContent = async (url: string): Promise<string> => {
  try {
    const response = await fetch(`http://localhost:3000/scrape?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const data = await response.json();
    return data.markdown;
  } catch (error) {
    console.error('Error fetching URL:', error);
    // Return a fallback markdown if the service is not available
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    return `# Content from ${domain}

## Metadata
- Source: ${url}
- Fetched: ${new Date().toISOString()}
- Status: Error (Python service unavailable)

## Content
Failed to fetch content. Please ensure the Python scraping service is running:

1. Navigate to the python-scraper directory
2. Install dependencies: \`pip install -r requirements.txt\`
3. Start the service: \`python scraper.py\`

### Raw URL
\`\`\`
${url}
\`\`\`
`;
  }
};

// Types for URL mentions
export type UrlMentionElement = {
  type: 'url-mention';
  url: string;
  fileName: string;
  children: [{ text: '' }];
}; 