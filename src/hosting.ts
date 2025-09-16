import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { format } from "date-fns";
import { render } from "@react-email/render";
import React from "react";
import { NewsDigestEmail } from "./emails/NewsDigestEmail.js";
import type { NewsCategory } from "./scraper.js";

export interface DigestData {
  date: string;
  introText: string;
  categories: NewsCategory[];
  timestamp: number;
}

const OUTPUT_DIR = join(process.cwd(), "public");
const DIGESTS_DIR = join(OUTPUT_DIR, "digests");

export function ensureDirectories(): void {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!existsSync(DIGESTS_DIR)) {
    mkdirSync(DIGESTS_DIR, { recursive: true });
  }
}

export function generateDigestSlug(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export async function saveDigestAsHTML(digestData: DigestData): Promise<string> {
  ensureDirectories();
  
  const slug = generateDigestSlug(new Date(digestData.timestamp));
  const emailHtml = render(
    React.createElement(NewsDigestEmail, {
      date: digestData.date,
      categories: digestData.categories,
      introText: digestData.introText,
    })
  );

  // Create a full HTML page wrapper
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily News Digest - ${digestData.date}</title>
  <meta name="description" content="${digestData.introText}">
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    .digest-wrapper { max-width: 800px; margin: 0 auto; padding: 20px; }
    .back-link { margin-bottom: 20px; }
    .back-link a { color: #00bfa5; text-decoration: none; }
    .back-link a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="digest-wrapper">
    <div class="back-link">
      <a href="../index.html">← Back to All Digests</a>
    </div>
    ${emailHtml}
  </div>
</body>
</html>`;

  const filePath = join(DIGESTS_DIR, `${slug}.html`);
  writeFileSync(filePath, fullHtml);
  
  return slug;
}

export function generateRSSFeed(digests: DigestData[]): string {
  const now = new Date();
  const baseUrl = process.env.SITE_URL || "https://sjoerdbeentjes.github.io/daily-digest";
  
  // Sort digests by timestamp descending (newest first)
  const sortedDigests = digests.sort((a, b) => b.timestamp - a.timestamp);
  
  const rssItems = sortedDigests.map(digest => {
    const slug = generateDigestSlug(new Date(digest.timestamp));
    const pubDate = new Date(digest.timestamp).toUTCString();
    const digestUrl = `${baseUrl}/digests/${slug}.html`;
    
    // Create description from categories
    const description = digest.categories
      .map(cat => `${cat.category}: ${cat.articles.length} articles`)
      .join(", ");
    
    return `    <item>
      <title>Daily News Digest - ${digest.date}</title>
      <link>${digestUrl}</link>
      <description><![CDATA[${digest.introText}

Categories: ${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${digestUrl}</guid>
    </item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Daily News Digest</title>
    <link>${baseUrl}</link>
    <description>AI-powered daily news digest with personalized summaries and insights</description>
    <language>en-us</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    
${rssItems}
  </channel>
</rss>`;
}

export function saveRSSFeed(digests: DigestData[]): void {
  ensureDirectories();
  
  const rssContent = generateRSSFeed(digests);
  const rssPath = join(OUTPUT_DIR, "rss.xml");
  writeFileSync(rssPath, rssContent);
}

export function generateIndexHTML(digests: DigestData[]): string {
  const baseUrl = process.env.SITE_URL || "https://sjoerdbeentjes.github.io/daily-digest";
  
  // Sort digests by timestamp descending (newest first)
  const sortedDigests = digests.sort((a, b) => b.timestamp - a.timestamp);
  
  const digestList = sortedDigests.map(digest => {
    const slug = generateDigestSlug(new Date(digest.timestamp));
    const digestUrl = `./digests/${slug}.html`;
    
    const categoryCount = digest.categories.length;
    const articleCount = digest.categories.reduce((total, cat) => total + cat.articles.length, 0);
    
    return `      <div class="digest-item">
        <h3><a href="${digestUrl}">${digest.date}</a></h3>
        <p class="digest-summary">${digest.introText}</p>
        <p class="digest-stats">${categoryCount} categories, ${articleCount} articles</p>
      </div>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily News Digest Archive</title>
  <meta name="description" content="Archive of AI-powered daily news digests">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header h1 {
      color: #bf4600;
      margin: 0 0 10px 0;
      font-size: 2.5em;
    }
    .header p {
      color: #666;
      font-size: 1.1em;
      margin: 0;
    }
    .rss-link {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      background-color: #ff6600;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
    .rss-link:hover {
      background-color: #e55a00;
    }
    .digest-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .digest-item {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .digest-item h3 {
      margin: 0 0 15px 0;
      font-size: 1.4em;
    }
    .digest-item h3 a {
      color: #00bfa5;
      text-decoration: none;
    }
    .digest-item h3 a:hover {
      text-decoration: underline;
    }
    .digest-summary {
      color: #333;
      margin: 0 0 10px 0;
      font-size: 1.05em;
    }
    .digest-stats {
      color: #666;
      font-size: 0.9em;
      margin: 0;
      font-style: italic;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Daily News Digest</h1>
      <p>AI-powered daily news digest with personalized summaries and insights</p>
      <a href="${baseUrl}/rss.xml" class="rss-link">📡 Subscribe to RSS Feed</a>
    </div>
    
    <div class="digest-list">
${digestList}
    </div>
    
    <div class="footer">
      <p>Generated with ❤️ by AI • <a href="https://github.com/sjoerdbeentjes/daily-digest">View Source</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function saveIndexHTML(digests: DigestData[]): void {
  ensureDirectories();
  
  const indexContent = generateIndexHTML(digests);
  const indexPath = join(OUTPUT_DIR, "index.html");
  writeFileSync(indexPath, indexContent);
}