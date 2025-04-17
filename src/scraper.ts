import fetch from "node-fetch";
import { config, newsSources } from "./config.js";

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
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ExtractedArticles {
  articles: Array<{
    title: string;
    url: string;
    content: string;
    category: string;
  }>;
}

const scrapeModel = "google/gemini-2.0-flash-001";
const summarizeModel = "google/gemini-2.0-flash-001";

export async function scrapeNews(): Promise<Article[]> {
  const articles: Article[] = [];

  for (const source of newsSources) {
    try {
      const response = await fetch(source.url);
      const html = await response.text();

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
${html}

Extract up to 5 most prominent articles. For each article, provide:
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

  console.log(result);

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
