import React from "react";
import nodemailer from "nodemailer";
import { format } from "date-fns";
import { render } from "@react-email/render";
import { config } from "./config.js";
import { NewsDigestEmail } from "./emails/NewsDigestEmail";
import type { NewsCategory } from "./scraper";

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: true,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

export async function sendNewsletter({
  introText,
  categories,
}: {
  introText: string;
  categories: NewsCategory[];
}): Promise<void> {
  const date = format(new Date(), "MMMM do, yyyy");
  const emailHtml = render(
    React.createElement(NewsDigestEmail, {
      date,
      categories,
      introText,
    })
  );

  await transporter.sendMail({
    from: config.EMAIL_FROM,
    to: config.EMAIL_TO,
    subject: `Daily News Digest - ${date}`,
    html: emailHtml,
  });
}
