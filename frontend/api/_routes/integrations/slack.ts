import crypto from "crypto";
import { waitUntil } from "@vercel/functions";
import { createComparisonJob, sendJson } from "../../_lib/sideby.js";
import { logger } from "../../_lib/log.js";
import { checkGlobalDailyBudget, checkRateLimit, getGlobalComparisonsDailyCap } from "../../_lib/rate-limit.js";
import { getClientIp } from "../../_lib/route-guard.js";
import { assertNoLikelySecrets } from "../../_lib/secret-scan.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 60, // Slack calls can run up to 60s in the background
};

// Parse urlencoded helper since Vercel bodyParser parses JSON automatically but not urlencoded
function parseUrlencoded(bodyStr: string): Record<string, string> {
  const params = new URLSearchParams(bodyStr);
  const result: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

// Verify Slack Request Signature
export function verifySlackSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  signingSecret: string
): boolean {
  try {
    // Reject non-numeric timestamps (NaN previously bypassed `< fiveMinutesAgo`)
    // and prevent replay attacks in either direction (±5 minute window).
    if (!/^\d+$/.test(timestamp)) return false;
    const parsedTs = Number(timestamp);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!Number.isSafeInteger(parsedTs) || Math.abs(nowSeconds - parsedTs) > 60 * 5) {
      return false;
    }

    const sigBaseString = `v0:${timestamp}:${rawBody}`;
    const calculatedSignature = "v0=" + crypto
      .createHmac("sha256", signingSecret)
      .update(sigBaseString)
      .digest("hex");

    const sigBuf = Buffer.from(signature);
    const calcBuf = Buffer.from(calculatedSignature);
    if (sigBuf.length !== calcBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, calcBuf);
  } catch {
    return false;
  }
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  // 1. Get raw request body for signature verification
  // Vercel's Node runtime has the raw body or string representation inside request.body if bodyParser is enabled,
  // or we can reconstruct it. Since it is form-urlencoded, Vercel might pass it as string or parsed object.
  let rawBody = "";
  if (typeof request.body === "string") {
    rawBody = request.body;
  } else if (request.body && typeof request.body === "object") {
    // Reconstruct urlencoded string if Vercel already parsed it
    const searchParams = new URLSearchParams(request.body as Record<string, string>);
    rawBody = searchParams.toString();
  }

  const slackSignature = request.headers["x-slack-signature"] as string;
  const slackTimestamp = request.headers["x-slack-request-timestamp"] as string;
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!signingSecret) {
    logger.error("SLACK_SIGNING_SECRET is not configured");
    return sendJson(response, { error: "Slack integration not configured." }, 503);
  }

  if (!slackSignature || !slackTimestamp) {
    logger.warn("Slack signature headers missing");
    return sendJson(response, { error: "Unauthorized" }, 401);
  }

  const isValid = verifySlackSignature(rawBody, slackTimestamp, slackSignature, signingSecret);
  if (!isValid) {
    logger.warn("Slack signature validation failed");
    return sendJson(response, { error: "Invalid signature" }, 401);
  }

  // 2. Rate limit by IP to prevent abuse
  const ip = getClientIp(request) || "unknown";
  const rateLimitKey = `slack:${ip}`;
  const limit = await checkRateLimit("ip", rateLimitKey, "comparison", 5);
  if (!limit.allowed) {
    return sendJson(response, {
      response_type: "ephemeral",
      text: "⚠️ Rate limit reached. Please wait a moment before trying again.",
    });
  }

  // 3. Parse payload parameters
  const params = parseUrlencoded(rawBody);
  const query = (params.text || "").trim();
  const responseUrl = params.response_url;

  if (!query) {
    return sendJson(response, {
      response_type: "ephemeral",
      text: "❌ Please provide a comparison query. Example: `/sideby React vs Vue`"
    });
  }

  if (query.length > 800) {
    return sendJson(response, {
      response_type: "ephemeral",
      text: "❌ Comparison query is too long (maximum 800 characters)."
    });
  }

  try {
    assertNoLikelySecrets(query);
  } catch {
    return sendJson(response, {
      response_type: "ephemeral",
      text: "❌ This query looks like it may contain an API key or secret. Remove secrets before sending."
    });
  }

  const globalBudget = await checkGlobalDailyBudget("comparisons", getGlobalComparisonsDailyCap());
  if (!globalBudget.allowed) {
    return sendJson(response, {
      response_type: "ephemeral",
      text: "⚠️ SideBy is at capacity right now. Please try again later."
    });
  }

  // 3. Jobs run as one explicitly configured owner. Never fall back to an
  // arbitrary user: any Slack workspace could otherwise write into that
  // person's account history and spend their quota.
  const userId = process.env.SLACK_JOB_OWNER_USER_ID;
  if (!userId) {
    return sendJson(response, {
      response_type: "ephemeral",
      text: "❌ The Slack integration is not fully configured."
    });
  }

  // Slack signs response_url, but only post back to Slack-owned hosts.
  let safeResponseUrl: string | null = null;
  try {
    const parsedResponseUrl = new URL(responseUrl || "");
    if (
      parsedResponseUrl.protocol === "https:" &&
      parsedResponseUrl.hostname === "hooks.slack.com" &&
      !parsedResponseUrl.port &&
      !parsedResponseUrl.username &&
      !parsedResponseUrl.password
    ) {
      safeResponseUrl = parsedResponseUrl.toString();
    }
  } catch {
    safeResponseUrl = null;
  }
  if (!safeResponseUrl) {
    return sendJson(response, { response_type: "ephemeral", text: "❌ Invalid Slack response URL." });
  }

  // 4. Immediately return a processing status to Slack to bypass the 3s timeout
  // Using Vercel functions waitUntil to trigger the research job in the background
  const runBackgroundJob = async () => {
    try {
      logger.info("Running background Slack comparison", { query, userId });
      const job = await createComparisonJob({ query, userId }, waitUntil);

      if (job.status === "failed" || !job.result) {
        throw new Error(job.error || "Comparison engine execution failed.");
      }

      const result = job.result;

      // Format Block Kit payload
      const blocks: Array<Record<string, unknown>> = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `⚖️ SideBy Comparison: ${result.entities.a.name} vs ${result.entities.b.name}`,
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Query:* \`${result.query}\`\n\n*Verdict Summary:*\n${result.verdict.summary || "No summary verdict generated."}`
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*📊 Scoring Dimensions:*"
          }
        }
      ];

      // Add dimensions scores
      if (result.dimensions && result.dimensions.length > 0) {
        let scoresText = "";
        result.dimensions.forEach((dim) => {
          scoresText += `• *${dim.subject}*:  ${result.entities.a.name} (${dim.a}/${dim.fullMark})  |  ${result.entities.b.name} (${dim.b}/${dim.fullMark})\n`;
        });
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: scoresText
          }
        });
      }

      // Add top sources
      if (result.sources && result.sources.length > 0) {
        blocks.push({
          type: "divider"
        });
        let sourcesText = "*🔗 Top Citations:*\n";
        result.sources.slice(0, 3).forEach((src, idx) => {
          sourcesText += `${idx + 1}. <${src.url}|${src.title}>\n`;
        });
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: sourcesText
          }
        });
      }

      // Brand link attribution
      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `🛠️ <https://snapsolve.ink|Made by SnapSolve Ink>`
          }
        ]
      });

      // Post final results back to Slack
      await fetch(safeResponseUrl, {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_type: "in_channel",
          blocks
        })
      });

      logger.info("Slack response posted successfully");
    } catch (err) {
      logger.error("Slack background runner failed", undefined, { error: String(err) });
      
      // Post error back to Slack responseUrl
      await fetch(safeResponseUrl, {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_type: "ephemeral",
          text: `❌ *SideBy error:* Failed to complete comparison for \`${query}\`. Please try again later.`
        })
      });
    }
  };

  // Register background task with Vercel waitUntil
  waitUntil(runBackgroundJob());

  // Respond immediately with loading indicator
  return sendJson(response, {
    response_type: "ephemeral",
    text: `🔍 *SideBy* has started researching **${query}** in the background. This will post results to this channel when finished...`
  });
}
