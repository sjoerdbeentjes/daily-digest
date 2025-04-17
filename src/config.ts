import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const configSchema = z.object({
  // Email configuration
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform(Number),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  EMAIL_FROM: z.string().email(),
  EMAIL_TO: z.string().email(),

  // OpenRouter API key for AI processing
  OPENROUTER_API_KEY: z.string(),
});

export const config = configSchema.parse(process.env);

export const newsSources = [
  {
    name: "The Verge",
    url: "https://www.theverge.com",
  },
  {
    name: "TechCrunch",
    url: "https://techcrunch.com",
  },
  {
    name: "Hacker News",
    url: "https://news.ycombinator.com",
  },
  {
    name: "The New York Times",
    url: "https://www.nytimes.com",
  },
  {
    name: "NOS",
    url: "https://nos.nl",
  },
  {
    name: "NRC",
    url: "https://nrc.nl",
  },
  {
    name: "9to5Mac",
    url: "https://9to5mac.com",
  },
  {
    name: "The Next Web",
    url: "https://thenextweb.com",
  },
  {
    name: "Axios",
    url: "https://axios.com",
  },
];
