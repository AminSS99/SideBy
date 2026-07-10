import { sendJson } from "../_lib/sideby.js";
import { isAuthEnabled, requireAuth } from "../_lib/auth.js";
import { llmChat, llmChatStream, type LLMMessage } from "../_lib/llm.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createDbClient } from "../../src/db/index.js";
import {
  formatKnowledgeContext,
  searchKnowledgeChunks,
} from "../_lib/knowledge.js";
import { captureServerEvent } from "../_lib/analytics.js";
import { sanitizeLlmText } from "../_lib/sanitize.js";
import { withRateLimit } from "../_lib/route-guard.js";
import { z } from "zod";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

const ChatBodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(8000),
  })).min(1).max(40),
  workspaceId: z.string().uuid().optional(),
  projectId: z.string().uuid().nullable().optional(),
  documentIds: z.array(z.string().uuid()).max(25).optional(),
  stream: z.boolean().optional(),
});

function wantsStream(request: VercelRequest, body: z.infer<typeof ChatBodySchema>) {
  const accept = request.headers.accept;
  const acceptHeader = Array.isArray(accept) ? accept.join(",") : accept || "";
  return body.stream === true || acceptHeader.includes("text/event-stream");
}

function extractAnswerContent(content: string) {
  try {
    const parsed = JSON.parse(content) as { answer?: unknown };
    if (parsed && typeof parsed === "object" && typeof parsed.answer === "string") {
      return sanitizeLlmText(parsed.answer, 8000);
    }
    return sanitizeLlmText(JSON.stringify(parsed, null, 2), 8000);
  } catch {
    return sanitizeLlmText(content, 8000);
  }
}

function writeSse(response: VercelResponse, event: string, data: unknown) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  return withRateLimit(request, response, "chat", async () => {
    try {
      const auth = isAuthEnabled() ? await requireAuth(request) : null;
      const body = ChatBodySchema.parse(request.body || {});

      const selectedDocumentIds = Array.isArray(body.documentIds)
        ? body.documentIds.filter((id): id is string => typeof id === "string" && id.length > 0)
        : [];
      const latestUserMessage = [...body.messages]
        .reverse()
        .find((message) => message.role === "user")?.content;
      let retrievedContext = "";
      let retrievalCount = 0;
      let selectedKnowledgeButNoContext = false;

      if (selectedDocumentIds.length > 0) {
        if (!auth?.userId) {
          return sendJson(response, { error: "Authentication required for knowledge chat." }, 401);
        }
        if (!body.workspaceId) {
          return sendJson(response, { error: "workspaceId is required when documents are selected." }, 400);
        }

        const db = createDbClient();
        const chunks = latestUserMessage
          ? await searchKnowledgeChunks(db, {
              userId: auth.userId,
              workspaceId: body.workspaceId,
              projectId: body.projectId || null,
              documentIds: selectedDocumentIds,
              query: latestUserMessage,
              topK: 8,
            })
          : [];

        retrievalCount = chunks.length;
        retrievedContext = chunks.length > 0 ? formatKnowledgeContext(chunks) : "";
        selectedKnowledgeButNoContext = chunks.length === 0;

        captureServerEvent(auth.userId, "knowledge_chat_retrieval", {
          workspace_id: body.workspaceId,
          project_id: body.projectId || null,
          selected_document_count: selectedDocumentIds.length,
          retrieval_count: retrievalCount,
        });
      }

      const sysMsg: LLMMessage = {
        role: "system",
        content: buildSystemPrompt(
          retrievedContext,
          selectedKnowledgeButNoContext,
          wantsStream(request, body) ? "text" : "json",
        ),
      };

      const messagesToRun = [
        sysMsg,
        ...body.messages.map((m) => ({ role: m.role, content: m.content })),
      ] as LLMMessage[];

      if (wantsStream(request, body)) {
        response.writeHead(200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        });
        writeSse(response, "meta", { retrievalCount });

        const result = await llmChatStream(messagesToRun, (token) => {
          writeSse(response, "token", { token: sanitizeLlmText(token, 1000) });
        });
        writeSse(response, "final", {
          answer: extractAnswerContent(result.content),
          retrievalCount,
          model: result.model,
          provider: result.provider,
        });
        response.end();
        return;
      }

      const result = await llmChat(messagesToRun);
      const answerContent = extractAnswerContent(result.content);

      return sendJson(response, { answer: answerContent, retrievalCount });
    } catch (error) {
      console.error("Chat API error:", error);
      const status = error instanceof z.ZodError ? 400 : 500;
      return sendJson(
        response,
        {
          error: error instanceof z.ZodError
            ? error.errors[0]?.message || "Invalid request body."
            : error instanceof Error ? error.message : "Chat request failed.",
        },
        status,
      );
    }
  });
}

function buildSystemPrompt(
  retrievedContext: string,
  selectedKnowledgeButNoContext: boolean,
  responseMode: "json" | "text",
) {
  const outputInstruction = responseMode === "json"
    ? "Return a JSON object with an answer string."
    : "Stream plain text only. Do not wrap the answer in JSON.";
  const base =
    `You are the SideBy Research Engine, an expert AI assistant that helps users analyze and compare technology products, tools, services, and their own uploaded workspace documents. ${outputInstruction}`;

  if (retrievedContext) {
    return `${base}

The user selected uploaded knowledge base documents. Answer from the retrieved chunks below when they are relevant. Cite uploaded evidence inline using the exact format [document name chunk N]. If the retrieved chunks do not contain enough information to answer a requested claim, clearly say the uploaded context is insufficient for that part before offering any general guidance.

Retrieved uploaded context:
${retrievedContext}`;
  }

  if (selectedKnowledgeButNoContext) {
    return `${base}

The user selected uploaded knowledge base documents, but no relevant chunks were retrieved. Answer using general SideBy knowledge only, and clearly mention that the uploaded context did not contain relevant support for the question.`;
  }

  return `${base}

No uploaded documents are active for this turn. Provide clear, accurate, concise general guidance based on best engineering practices.`;
}
