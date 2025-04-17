# Personal News Reporter

An AI-powered news aggregator that sends daily email digests of your favorite news sources. The digest is automatically generated every morning at 6:00 AM (Amsterdam time) using GitHub Actions.

## Features

- Scrapes configured news sources for latest articles
- Uses OpenRouter AI with structured outputs to summarize and organize articles by topic
- Sends beautifully formatted HTML email digests
- Runs automatically via GitHub Actions
- Configurable news sources and email settings

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   SMTP_HOST=your-smtp-host
   SMTP_PORT=587
   SMTP_USER=your-smtp-username
   SMTP_PASS=your-smtp-password
   EMAIL_FROM=sender@example.com
   EMAIL_TO=recipient@example.com
   OPENROUTER_API_KEY=your-openrouter-api-key
   ```

4. Configure your news sources in `src/config.ts`

5. Add the following secrets to your GitHub repository:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `EMAIL_FROM`
   - `EMAIL_TO`
   - `OPENROUTER_API_KEY`

## Local Development

To run the script locally:

```bash
npm start
```

## Customization

### Adding News Sources

Edit `src/config.ts` to add or modify news sources. Each source needs:
- `name`: Display name of the source
- `url`: Base URL of the news site
- `selector`: CSS selector to find article elements

### Modifying Email Template

The email template can be customized in `src/mailer.ts`. It uses inline CSS for maximum email client compatibility.

### Changing Schedule

The schedule can be modified in `.github/workflows/daily-digest.yml`. The current schedule is set to run at 6:00 AM Amsterdam time (4:00 UTC). 