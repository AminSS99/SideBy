import { sendJson } from "./_lib/sideby.js";
import { authenticateRequest, isAuthEnabled } from "./_lib/auth.js";
import { llmChat, type LLMMessage } from "./_lib/llm.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  const userId = isAuthEnabled() ? await authenticateRequest(request) : null;
  if (isAuthEnabled() && !userId) {
    return sendJson(response, { error: "Authentication required." }, 401);
  }

  try {
    const body = request.body as { messages?: LLMMessage[] };
    if (!body.messages || !Array.isArray(body.messages)) {
      return sendJson(response, { error: "Messages array is required." }, 400);
    }

    const sysMsg: LLMMessage = {
      role: "system",
      content: "You are the SideBy Research Engine, an expert AI assistant that helps users analyze and compare technology products, tools, and services. Provide clear, accurate, and concise information based on best engineering practices. Use JSON format if requested, otherwise use clean text.",
    };

    const messagesToRun = [
      sysMsg,
      ...body.messages.map((m) => ({ role: m.role, content: m.content })),
    ] as LLMMessage[];

    const result = await llmChat(messagesToRun);
    
    // Sometimes LLM models return wrapped JSON if format wasn't explicitly enforced
    let answerContent = result.content;
    try {
        const parsed = JSON.parse(result.content);
        if (parsed && typeof parsed === "object" && parsed.answer) {
            answerContent = parsed.answer;
        } else {
            answerContent = JSON.stringify(parsed, null, 2);
        }
    } catch {
        // Not JSON, just use raw string
    }

    return sendJson(response, { answer: answerContent });
  } catch (error) {
    console.error("Chat API error:", error);
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Chat request failed." },
      500,
    );
  }
}