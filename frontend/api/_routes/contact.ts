import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { sendEmail } from "../_lib/email.js";
import { sendJson } from "../_lib/sideby.js";
import { verifyTurnstileToken } from "../_lib/turnstile.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
  api: {
    bodyParser: {
      sizeLimit: "64kb",
    },
  },
};

const ContactSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(10).max(4000),
  turnstileToken: z.string().trim().optional(),
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    if (request.method !== "POST") {
      return sendJson(response, { error: "Method not allowed" }, 405);
    }

    const body = ContactSchema.parse(request.body || {});
    await verifyTurnstileToken(request, body.turnstileToken);

    const name = `${body.firstName} ${body.lastName}`.trim();
    const to = process.env.CONTACT_TO_EMAIL || "support@snapsolve.ink";

    await sendEmail({
      to,
      subject: `SideBy contact: ${name}`,
      html: [
        `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`,
        `<p><strong>Email:</strong> ${escapeHtml(body.email)}</p>`,
        `<p><strong>Message:</strong></p>`,
        `<p>${escapeHtml(body.message).replace(/\n/g, "<br />")}</p>`,
      ].join(""),
      text: `Name: ${name}\nEmail: ${body.email}\n\n${body.message}`,
    });

    return sendJson(response, { success: true });
  } catch (error) {
    const status =
      error instanceof z.ZodError
        ? 400
        : error instanceof Error && "statusCode" in error
          ? (error as Error & { statusCode: number }).statusCode
          : 500;

    return sendJson(
      response,
      {
        error:
          error instanceof z.ZodError
            ? error.errors[0]?.message || "Invalid contact form."
            : error instanceof Error
              ? error.message
              : "Unable to send your message.",
      },
      status,
    );
  }
}
