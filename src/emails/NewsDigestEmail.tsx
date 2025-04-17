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
    fontFamily: '"Times New Roman", Times, serif',
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
  },
  container: {
    margin: "0 auto",
    padding: "64px 32px",
    maxWidth: "680px",
  },
  header: {
    marginBottom: "64px",
    textAlign: "center" as const,
  },
  brandText: {
    fontSize: "28px",
    fontFamily: '"Times New Roman", Times, serif',
    marginBottom: "32px",
    fontStyle: "italic",
    letterSpacing: "0.03em",
  },
  title: {
    color: "#bf4600",
    fontSize: "64px",
    fontWeight: "400",
    letterSpacing: "0.05em",
    margin: "0",
    lineHeight: "1.1",
    fontFamily: '"Times New Roman", Times, serif',
  },
  issueNumber: {
    fontSize: "36px",
    color: "#1a1a1a",
    margin: "24px 0",
    fontWeight: "300",
    fontFamily: '"Times New Roman", Times, serif',
  },
  date: {
    color: "#666666",
    fontSize: "16px",
    margin: "24px 0",
    textTransform: "uppercase" as const,
    letterSpacing: "0.2em",
    fontFamily: '"Times New Roman", Times, serif',
  },
  introSection: {
    marginBottom: "64px",
    borderBottom: "1px solid #e0e0e0",
    paddingBottom: "48px",
  },
  greeting: {
    fontSize: "24px",
    marginBottom: "32px",
    fontStyle: "italic",
    fontFamily: '"Times New Roman", Times, serif',
    lineHeight: "1.4",
  },
  introText: {
    fontSize: "18px",
    lineHeight: "1.6",
    color: "#333333",
    fontFamily: '"Times New Roman", Times, serif',
  },
  categorySection: {
    marginBottom: "64px",
  },
  categoryTitle: {
    color: "#1a1a1a",
    fontSize: "28px",
    fontWeight: "400",
    margin: "48px 0 32px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.15em",
    fontFamily: '"Times New Roman", Times, serif',
  },
  commentary: {
    color: "#333333",
    fontSize: "18px",
    lineHeight: "1.6",
    margin: "24px 0",
    fontStyle: "italic",
    fontFamily: '"Times New Roman", Times, serif',
  },
  articleContainer: {
    marginBottom: "32px",
  },
  articleTitle: {
    color: "#00bfa5",
    fontSize: "21px",
    textDecoration: "none",
    fontWeight: "400",
    lineHeight: "1.4",
    display: "block",
    marginBottom: "12px",
    fontFamily: '"Times New Roman", Times, serif',
    transition: "color 0.2s ease",
    ":hover": {
      color: "#666666",
    },
  },
  sourceText: {
    color: "#666666",
    fontSize: "16px",
    margin: "8px 0",
    fontStyle: "italic",
    fontFamily: '"Times New Roman", Times, serif',
  },
  summaryText: {
    color: "#333333",
    fontSize: "18px",
    lineHeight: "1.6",
    margin: "16px 0",
    fontFamily: '"Times New Roman", Times, serif',
  },
  divider: {
    margin: "48px 0",
    borderTop: "1px solid #e0e0e0",
  },
  footer: {
    marginTop: "64px",
    borderTop: "1px solid #e0e0e0",
    paddingTop: "48px",
    textAlign: "center" as const,
  },
  footerText: {
    color: "#666666",
    fontSize: "16px",
    margin: "24px 0",
    fontStyle: "italic",
    fontFamily: '"Times New Roman", Times, serif',
    letterSpacing: "0.05em",
  },
} as const;
