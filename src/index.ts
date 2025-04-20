import { scrapeNews, summarizeArticles } from "./scraper.js";
import { sendNewsletter } from "./mailer.js";

async function main() {
  try {
    console.log("Starting news collection...");
    const articles = await scrapeNews();

    if (articles.length === 0) {
      console.log("No articles found. Exiting...");
      return;
    }

    console.log(`Found ${articles.length} articles. Generating summary...`);
    const summary = await summarizeArticles(articles);

    console.log("Sending email...");
    await sendNewsletter({
      introText: summary.introText,
      categories: summary.categories,
    });

    console.log("Newsletter sent successfully!");
  } catch (error) {
    console.error("Error running news digest:", error);
    process.exit(1);
  }
}

main();
