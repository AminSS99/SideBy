import crypto from "crypto";
import { waitUntil } from "@vercel/functions";
import { createDbClient } from "../../src/db/index.js";
import { users } from "../../src/db/schema.js";
import { createComparisonJob, sendJson } from "../_lib/sideby.js";
import { logger } from "../_lib/log.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 60, // Slack calls can run up to 60s in the background
};

// Parse urlencoded helper since Vercel bodyParser parses JSON automatically but not urlencoded
function parseUrlenocded(bodyStr: string): Record<string, string> {
  const params = new URLSearchParams(bodyStr);
  const result: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

// Verify Slack Request Signature
function verifySlackSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  signingSecret: string
): boolean {
  try {
    // Prevent replay attacks (5 minute limit)
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
    if (parseInt(timestamp) < fiveMinutesAgo) return false;

    const sigBaseString = `v0:${timestamp}:${rawBody}`;
    const calculatedSignature = "v0=" + crypto
      .createHmac("sha256", signingSecret)
      .update(sigBaseString)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  } catch (err) {
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
    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(request.body)) {
      searchParams.append(k, String(v));
    }
    rawBody = searchParams.toString();
  }

  const slackSignature = request.headers["x-slack-signature"] as string;
  const slackTimestamp = request.headers["x-slack-request-timestamp"] as string;
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (signingSecret && slackSignature && slackTimestamp) {
    const isValid = verifySlackSignature(rawBody, slackTimestamp, slackSignature, signingSecret);
    if (!isValid) {
      logger.warn("Slack signature validation failed");
      return sendJson(response, { error: "Invalid signature" }, 401);
    }
  } else if (signingSecret) {
    logger.warn("Slack signing secret configured but signature headers missing");
    return sendJson(response, { error: "Unauthorized" }, 401);
  }

  // 2. Parse payload parameters
  const params = parseUrlenocded(rawBody);
  const query = (params.text || "").trim();
  const responseUrl = params.response_url;

  if (!query) {
    return sendJson(response, {
      response_type: "ephemeral",
      text: "❌ Please provide a comparison query. Example: `/sideby React vs Vue`"
    });
  }

  // 3. Obtain a fallback user from DB to assign job ownership
  const db = createDbClient();
  const [fallbackUser] = await db.select({ id: users.id }).from(users).limit(1);
  const userId = fallbackUser?.id;

  if (!userId) {
    return sendJson(response, {
      response_type: "ephemeral",
      text: "❌ Server configuration error: No registered users found to run comparisons."
    });
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
      const blocks = [
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
      await fetch(responseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_type: "in_channel",
          blocks
        })
      });

      logger.info("Slack response posted successfully");
    } catch (err) {
      logger.error("Slack background runner failed", { error: String(err) });
      
      // Post error back to Slack responseUrl
      await fetch(responseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_type: "ephemeral",
          text: `❌ *SideBy error:* Failed to complete comparison for \`${query}\`. Reason: ${err instanceof Error ? err.message : String(err)}`
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
