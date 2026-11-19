import { eq } from "drizzle-orm";
import { createDbClient } from "../../src/db/index.js";
import { users } from "../../src/db/schema.js";
import { logger } from "./log.js";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "SideBy <onboarding@resend.dev>";
  if (!apiKey) {
    logger.info("Resend not configured; email skipped", { subject: payload.subject });
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    logger.warn("Resend API error", { status: response.status, body: bodyText.slice(0, 200) });
    throw new Error(`Email delivery failed (${response.status}).`);
  }

  return response.json();
}

export async function sendComparisonCompleteEmail(params: {
  userId: string;
  comparisonId: string;
  query: string;
  slug: string;
}) {
  const db = createDbClient();
  const [user] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, params.userId))
    .limit(1);

  if (!user?.email) return { skipped: true };

  const appUrl = (process.env.VITE_APP_URL || "http://localhost:5173").replace(/\/+$/, "");
  const url = `${appUrl}/app/comparisons/${encodeURIComponent(params.comparisonId)}`;
  return sendEmail({
    to: user.email,
    subject: `SideBy comparison ready: ${params.query.slice(0, 120)}`,
    html: [
      `<p>Hi ${escapeHtml(user.name || "there")},</p>`,
      `<p>Your SideBy comparison is ready:</p>`,
      `<p><strong>${escapeHtml(params.query)}</strong></p>`,
      `<p><a href="${escapeHtml(url)}">Open the comparison</a></p>`,
    ].join(""),
    text: `Your SideBy comparison is ready: ${params.query}\n${url}`,
  });
}

export async function sendBillingAlert(params: {
  userId?: string | null;
  email?: string | null;
  subject: string;
  message: string;
}) {
  let email = params.email || null;
  if (!email && params.userId) {
    const db = createDbClient();
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);
    email = user?.email || null;
  }

  if (!email) return { skipped: true };

  return sendEmail({
    to: email,
    subject: params.subject,
    html: `<p>${escapeHtml(params.message)}</p>`,
    text: params.message,
  });
}
