import { sendJson } from "../_lib/sideby.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 5,
};

export default function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "GET") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  return sendJson(response, {
    openapi: "3.1.0",
    info: {
      title: "SideBy API",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        ApiKey: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
    security: [{ ApiKey: [] }],
    paths: {
      "/api/v1/comparisons": {
        get: { summary: "List comparisons" },
        post: { summary: "Create a comparison" },
      },
      "/api/v1/comparisons/{id}": {
        get: { summary: "Get comparison result" },
      },
      "/api/v1/comparisons/{id}/followups": {
        post: { summary: "Ask a source-grounded follow-up question" },
      },
      "/api/v1/comparisons/{id}/export": {
        get: { summary: "Export comparison as markdown or JSON" },
      },
    },
  });
}
