import { scrapeNews, summarizeArticles } from "./scraper.js";
import { sendNewsletter } from "./mailer.js";
import { addDigest } from "./storage.js";
import { saveDigestAsHTML, saveRSSFeed, saveIndexHTML } from "./hosting.js";
import { format } from "date-fns";

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

    const now = new Date();
    const digestData = {
      date: format(now, "MMMM do, yyyy"),
      introText: summary.introText,
      categories: summary.categories,
      timestamp: now.getTime(),
    };

    console.log("Saving digest data and generating hosted version...");
    const allDigests = addDigest(digestData);
    
    console.log("Generating HTML digest...");
    const slug = await saveDigestAsHTML(digestData);
    console.log(`HTML digest saved as: ${slug}.html`);
    
    console.log("Generating RSS feed...");
    saveRSSFeed(allDigests);
    
    console.log("Generating index page...");
    saveIndexHTML(allDigests);

    console.log("Sending email...");
    await sendNewsletter({
      introText: summary.introText,
      categories: summary.categories,
    });

    console.log("Newsletter sent successfully!");
    console.log(`Hosted digest available at: digests/${slug}.html`);
    console.log("RSS feed updated at: rss.xml");
  } catch (error) {
    console.error("Error running news digest:", error);
    process.exit(1);
  }
}

main();
