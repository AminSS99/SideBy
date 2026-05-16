import { sendJson } from "./_lib/sideby.js";
import { isAuthEnabled, requireAuth } from "./_lib/auth.js";
import { llmChat, type LLMMessage } from "./_lib/llm.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createDbClient } from "../src/db/index.js";
import {
  formatKnowledgeContext,
  searchKnowledgeChunks,
} from "./_lib/knowledge.js";
import { captureServerEvent } from "./_lib/analytics.js";

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

  try {
    const auth = isAuthEnabled() ? await requireAuth(request) : null;
    const body = request.body as {
      messages?: LLMMessage[];
      workspaceId?: string;
      projectId?: string | null;
      documentIds?: string[];
    };

    if (!body.messages || !Array.isArray(body.messages)) {
      return sendJson(response, { error: "Messages array is required." }, 400);
    }

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
      content: buildSystemPrompt(retrievedContext, selectedKnowledgeButNoContext),
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

    return sendJson(response, { answer: answerContent, retrievalCount });
  } catch (error) {
    console.error("Chat API error:", error);
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Chat request failed." },
      500,
    );
  }
}

function buildSystemPrompt(retrievedContext: string, selectedKnowledgeButNoContext: boolean) {
  const base =
    "You are the SideBy Research Engine, an expert AI assistant that helps users analyze and compare technology products, tools, services, and their own uploaded workspace documents. Return a JSON object with an answer string.";

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
