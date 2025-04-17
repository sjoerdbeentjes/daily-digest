import fetch from "node-fetch";
import { config, newsSources } from "./config.js";
import sanitizeHtml from "sanitize-html";
import { chromium } from "playwright";

interface Article {
  title: string;
  url: string;
  content: string;
  source: string;
  category: string;
}

export interface NewsCategory {
  category: string;
  articles: {
    title: string;
    url: string;
    source: string;
    summary?: string;
  }[];
  commentary?: string;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface GenerationResponse {
  data: {
    total_cost: number;
    model: string;
    usage: number;
    latency: number;
    tokens_prompt: number;
    tokens_completion: number;
  };
}

interface GenerationDetails {
  total_cost: number;
  model: string;
  usage: number;
  latency: number;
  tokens_prompt: number;
  tokens_completion: number;
}

interface ExtractedArticles {
  articles: Array<{
    title: string;
    url: string;
    content: string;
    category: string;
  }>;
}

interface CostTracker {
  totalCost: number;
  modelCosts: Record<string, number>;
  totalTokens: {
    prompt: number;
    completion: number;
  };
  operations: Array<{
    operation: string;
    model: string;
    cost: number;
    tokens: {
      prompt: number;
      completion: number;
    };
  }>;
}

const costTracker: CostTracker = {
  totalCost: 0,
  modelCosts: {},
  totalTokens: {
    prompt: 0,
    completion: 0,
  },
  operations: [],
};

const scrapeModel = "openai/gpt-4.1-mini";
const summarizeModel = "openai/gpt-4.1-mini";

function trackCosts(operation: string, details: GenerationDetails) {
  costTracker.totalCost += details.total_cost;

  if (!costTracker.modelCosts[details.model]) {
    costTracker.modelCosts[details.model] = 0;
  }
  costTracker.modelCosts[details.model] += details.total_cost;

  costTracker.totalTokens.prompt += details.tokens_prompt;
  costTracker.totalTokens.completion += details.tokens_completion;

  costTracker.operations.push({
    operation,
    model: details.model,
    cost: details.total_cost,
    tokens: {
      prompt: details.tokens_prompt,
      completion: details.tokens_completion,
    },
  });
}

export function reportTotalCosts(): void {
  console.log("\n=== OpenRouter API Cost Report ===");
  console.log(`Total Cost: $${costTracker.totalCost.toFixed(4)}`);

  console.log("\nCosts by Model:");
  Object.entries(costTracker.modelCosts).forEach(([model, cost]) => {
    console.log(`${model}: $${cost.toFixed(4)}`);
  });

  console.log("\nTotal Tokens:");
  console.log(`Prompt: ${costTracker.totalTokens.prompt}`);
  console.log(`Completion: ${costTracker.totalTokens.completion}`);

  console.log("\nDetailed Operations:");
  costTracker.operations.forEach((op) => {
    console.log(`\n${op.operation}:`);
    console.log(`  Model: ${op.model}`);
    console.log(`  Cost: $${op.cost.toFixed(4)}`);
    console.log(
      `  Tokens: ${op.tokens.prompt} prompt, ${op.tokens.completion} completion`
    );
  });
  console.log("\n===============================");
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getGenerationDetails(
  id: string,
  maxRetries = 3
): Promise<GenerationDetails> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://openrouter.ai/api/v1/generation?id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        // For certain status codes, we might want to stop retrying immediately
        if (response.status === 404 || response.status === 401) {
          throw new Error(
            `Failed to get generation details: ${response.statusText}`
          );
        }
        throw new Error(`Request failed with status: ${response.status}`);
      }

      const data = (await response.json()) as GenerationResponse;
      return {
        total_cost: data.data.total_cost,
        model: data.data.model,
        usage: data.data.usage,
        latency: data.data.latency,
        tokens_prompt: data.data.tokens_prompt,
        tokens_completion: data.data.tokens_completion,
      };
    } catch (error) {
      lastError = error as Error;

      // If this was our last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw new Error(
          `Failed to get generation details after ${maxRetries} attempts: ${lastError.message}`
        );
      }

      // Calculate delay with exponential backoff (1s, 2s, 4s, ...)
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  // This should never be reached due to the throw in the loop, but TypeScript needs it
  throw lastError || new Error("Unexpected error in retry loop");
}

function sanitizeNewsHtml(html: string, baseUrl: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "a",
      "article",
      "section",
      "main",
      "div",
      "span",
      "ul",
      "ol",
      "li",
    ],
    allowedAttributes: {
      a: ["href", "title"],
      "*": ["class", "id"], // Keep main structural classes/ids for targeting content
    },
    // Remove empty elements
    exclusiveFilter: function (frame: sanitizeHtml.IFrame): boolean {
      return !frame.text.trim();
    },
    // Transform relative URLs to absolute
    transformTags: {
      a: function (
        tagName: string,
        attribs: { [key: string]: string }
      ): sanitizeHtml.Tag {
        if (attribs.href && !attribs.href.startsWith("http")) {
          attribs.href = new URL(attribs.href, baseUrl).toString();
        }
        return {
          tagName,
          attribs,
        };
      },
    },
  });
}

export async function scrapeNews(): Promise<Article[]> {
  const articles: Article[] = [];
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    hasTouch: false,
    isMobile: false,
    locale: "en-US",
    timezoneId: "America/New_York",
    permissions: ["geolocation"],
    javaScriptEnabled: true,
  });

  try {
    for (const source of newsSources) {
      try {
        const page = await context.newPage();

        // Set a longer timeout for navigation
        page.setDefaultTimeout(60000);

        // Add common browser headers
        await page.setExtraHTTPHeaders({
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Sec-Ch-Ua":
            '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"macOS"',
        });

        // Navigate with less strict conditions
        await page.goto(source.url, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });

        // Wait for some content to be visible
        try {
          await page.waitForSelector(
            "article, .article, .post, main, .content",
            { timeout: 10000 }
          );
        } catch (e) {
          // Continue even if we can't find these specific selectors
          console.log(
            `Warning: Could not find main content selectors for ${source.name}`
          );
        }

        const html = await page.content();
        await page.close();

        // Sanitize HTML before sending to AI
        const sanitizedHtml = sanitizeNewsHtml(html, source.url);

        // Use OpenRouter AI to extract articles from the HTML
        const extractionResponse = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
              "HTTP-Referer":
                "https://github.com/sjoerdbeentjes/personal-reporter",
            },
            body: JSON.stringify({
              model: scrapeModel,
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "news_articles",
                  strict: true,
                  schema: {
                    type: "object",
                    properties: {
                      articles: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: {
                              type: "string",
                              description: "The article title",
                            },
                            url: {
                              type: "string",
                              description: "Full URL of the article",
                            },
                            content: {
                              type: "string",
                              description:
                                "Brief excerpt or summary of the article content",
                            },
                            category: {
                              type: "string",
                              description: "Category or topic of the article",
                            },
                          },
                          required: ["title", "url", "content", "category"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["articles"],
                    additionalProperties: false,
                  },
                },
              },
              messages: [
                {
                  role: "user",
                  content: `You are a web scraping assistant. Extract news articles from the following HTML content from ${source.name}. Return the data in a structured format.

The HTML content is:
${sanitizedHtml}

Extract up to 10 most prominent articles. For each article, provide:
1. The article title
2. The full URL (if relative, convert to absolute using base URL: ${source.url})
3. A brief excerpt or summary of the content
4. The most appropriate category for the article (e.g., Technology, Politics, Business, etc.)`,
                },
              ],
            }),
          }
        );

        if (!extractionResponse.ok) {
          throw new Error(
            `OpenRouter API error: ${extractionResponse.statusText}`
          );
        }

        const result = (await extractionResponse.json()) as OpenRouterResponse;

        // Get generation details
        const details = await getGenerationDetails(result.id);
        trackCosts(`Scraping ${source.name}`, details);
        console.log(`Scraping cost for ${source.name}:`, {
          cost: details.total_cost,
          model: details.model,
          tokens: {
            prompt: details.tokens_prompt,
            completion: details.tokens_completion,
          },
          latency: details.latency,
        });

        const extractedData = JSON.parse(
          result.choices[0].message.content
        ) as ExtractedArticles;

        articles.push(
          ...extractedData.articles.map((article) => ({
            ...article,
            source: source.name,
          }))
        );
      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error);
      }
    }

    return articles;
  } finally {
    await browser.close();
  }
}

export async function summarizeArticles(
  articles: Article[]
): Promise<NewsCategory[]> {
  const prompt = `You are a professional newsletter curator. Analyze the following articles and create a structured digest with the following requirements:

1. Group articles by topic/theme into categories
2. For each category:
   - Provide a category name
   - Add a brief, insightful commentary about the theme
   - Include relevant articles with their titles and optional 1-2 sentence summaries
   - Provide max. 3 articles per category

Articles to process:
${articles
  .map(
    (a) => `
Title: ${a.title}
Source: ${a.source}
Content: ${a.content}
URL: ${a.url}
---`
  )
  .join("\n")}`;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://github.com/sjoerdbeentjes/personal-reporter",
      },
      body: JSON.stringify({
        model: summarizeModel,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "news_digest",
            strict: true,
            schema: {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: {
                        type: "string",
                        description: "Name of the news category or theme",
                      },
                      commentary: {
                        type: "string",
                        description:
                          "Insightful commentary about this group of articles",
                      },
                      articles: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: {
                              type: "string",
                              description: "Original article title",
                            },
                            url: {
                              type: "string",
                              description: "Article URL",
                            },
                            source: {
                              type: "string",
                              description: "Source name",
                            },
                            summary: {
                              type: "string",
                              description:
                                "1-2 sentence summary of the article",
                            },
                          },
                          required: ["title", "url", "source", "summary"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["category", "commentary", "articles"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["categories"],
              additionalProperties: false,
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const result = (await response.json()) as OpenRouterResponse;

  // Get generation details
  const details = await getGenerationDetails(result.id);
  trackCosts("Summarization", details);
  console.log("Summarization cost:", {
    cost: details.total_cost,
    model: details.model,
    tokens: {
      prompt: details.tokens_prompt,
      completion: details.tokens_completion,
    },
    latency: details.latency,
  });

  reportTotalCosts();

  try {
    // OpenRouter returns the content as a string that needs to be parsed
    const parsedContent = JSON.parse(result.choices[0].message.content);
    return parsedContent.categories as NewsCategory[];
  } catch (error) {
    console.error("Error parsing AI response:", error);
    // Fallback to a single category if parsing fails
    return [
      {
        category: "Today's News",
        articles: articles.map((a) => ({
          title: a.title,
          url: a.url,
          source: a.source,
        })),
      },
    ];
  }
}
