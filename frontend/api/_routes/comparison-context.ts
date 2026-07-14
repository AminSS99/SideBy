/** Import a public URL as concise, source-attributed comparison context. */
import { z } from "zod";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth.js";
import { extractPage } from "../_lib/firecrawl.js";
import { assertSafeWebhookUrl } from "../_lib/webhook-url.js";
import { captureServerEvent } from "../_lib/analytics.js";
import { sendJson } from "../_lib/sideby.js";

const BodySchema = z.object({ url: z.string().url().max(2048) });

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") return sendJson(response, { error: "Method not allowed" }, 405);
  try {
    const auth = await requireAuth(request);
    const { url } = BodySchema.parse(request.body || {});
    assertSafeWebhookUrl(url);
    const page = await extractPage(url);
    if (!page?.markdown.trim()) return sendJson(response, { error: "We could not extract usable requirements from that URL." }, 422);
    const excerpt = page.markdown.replace(/\s+/g, " ").trim().slice(0, 1100);
    captureServerEvent(auth.userId, "comparison_context_url_imported", { host: new URL(page.url).hostname, characters: excerpt.length });
    return sendJson(response, {
      context: `Requirements from ${page.title || new URL(page.url).hostname}: ${excerpt}`,
      source: { title: page.title || new URL(page.url).hostname, url: page.url },
    });
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : error instanceof Error && "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 500;
    return sendJson(response, { error: error instanceof Error ? error.message : "Unable to import context." }, status);
  }
}
