import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Heading,
} from "@react-email/components";

interface NewsCategory {
  category: string;
  articles: {
    title: string;
    url: string;
    source: string;
    summary?: string;
  }[];
  commentary?: string;
}

interface NewsDigestEmailProps {
  date: string;
  categories: NewsCategory[];
}

export const NewsDigestEmail: React.FC<NewsDigestEmailProps> = ({
  date = new Date().toLocaleDateString(),
  categories = [],
}) => {
  return (
    <Html>
      <Head>
        <title>{`Daily News Digest - ${date}`}</title>
      </Head>
      <Body style={styles.main}>
        <Container style={styles.container}>
          {/* Header Section */}
          <Section style={styles.header}>
            <Heading as="h1" style={styles.title}>
              DAILY NEWS DIGEST
            </Heading>
            <Text style={styles.date}>{date}</Text>
          </Section>

          {/* Content Sections */}
          {categories.map((category, index) => (
            <Section key={index} style={styles.categorySection}>
              <Heading as="h2" style={styles.categoryTitle}>
                {category.category}
              </Heading>

              {category.commentary && (
                <Text style={styles.commentary}>{category.commentary}</Text>
              )}

              {category.articles.map((article, articleIndex) => (
                <div key={articleIndex} style={styles.articleContainer}>
                  <Link href={article.url} style={styles.articleTitle}>
                    {article.title}
                  </Link>
                  <Text style={styles.sourceText}>{article.source}</Text>
                  {article.summary && (
                    <Text style={styles.summaryText}>{article.summary}</Text>
                  )}
                </div>
              ))}

              {index < categories.length - 1 && <Hr style={styles.divider} />}
            </Section>
          ))}
        </Container>
      </Body>
    </Html>
  );
};

export default NewsDigestEmail;

const styles = {
  main: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif',
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
  },
  container: {
    margin: "0 auto",
    padding: "48px 24px",
    maxWidth: "640px",
  },
  header: {
    marginBottom: "48px",
    textAlign: "center" as const,
  },
  brandText: {
    fontSize: "24px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif',
    marginBottom: "24px",
    fontStyle: "italic",
  },
  title: {
    color: "#1a1a1a",
    fontSize: "48px",
    fontWeight: "400",
    letterSpacing: "0.1em",
    margin: "0",
    lineHeight: "1.2",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, Georgia, "Times New Roman", Times, serif',
  },
  issueNumber: {
    fontSize: "32px",
    color: "#1a1a1a",
    margin: "16px 0",
    fontWeight: "300",
  },
  date: {
    color: "#666666",
    fontSize: "14px",
    margin: "16px 0",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
  },
  introSection: {
    marginBottom: "48px",
    borderBottom: "1px solid #e5e5e5",
    paddingBottom: "32px",
  },
  greeting: {
    fontSize: "20px",
    marginBottom: "24px",
    fontStyle: "italic",
  },
  introText: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#333333",
  },
  categorySection: {
    marginBottom: "48px",
  },
  categoryTitle: {
    color: "#1a1a1a",
    fontSize: "24px",
    fontWeight: "400",
    margin: "32px 0 24px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  commentary: {
    color: "#333333",
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "16px 0",
    fontStyle: "italic",
  },
  articleContainer: {
    marginBottom: "24px",
  },
  articleTitle: {
    color: "#00bfa5",
    fontSize: "18px",
    textDecoration: "none",
    fontWeight: "400",
    lineHeight: "1.4",
    display: "block",
    marginBottom: "8px",
  },
  sourceText: {
    color: "#666666",
    fontSize: "14px",
    margin: "8px 0",
    fontStyle: "italic",
  },
  summaryText: {
    color: "#333333",
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "12px 0",
  },
  divider: {
    margin: "32px 0",
    borderTop: "1px solid #e5e5e5",
  },
  footer: {
    marginTop: "48px",
    borderTop: "1px solid #e5e5e5",
    paddingTop: "32px",
    textAlign: "center" as const,
  },
  footerText: {
    color: "#666666",
    fontSize: "14px",
    margin: "16px 0",
    fontStyle: "italic",
  },
} as const;
