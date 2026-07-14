/** Team comments and decision notes for a comparison. */
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../_lib/auth.js";
import { canAccessComparison, canMutateComparison } from "../../../_lib/db-auth.js";
import { sendJson } from "../../../_lib/sideby.js";
import { captureServerEvent } from "../../../_lib/analytics.js";
import { createDbClient } from "../../../../src/db/index.js";
import { comparisonNotes, users } from "../../../../src/db/schema.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const NoteSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  kind: z.enum(["comment", "decision"]).default("comment"),
});

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    const auth = await requireAuth(request);
    const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
    if (!id) return sendJson(response, { error: "Comparison id is required." }, 400);
    const db = createDbClient();
    const canAccess = await canAccessComparison(db, auth.userId, id);
    if (!canAccess) return sendJson(response, { error: "Comparison not found." }, 404);

    if (request.method === "GET") {
      const notes = await db
        .select({
          id: comparisonNotes.id,
          body: comparisonNotes.body,
          kind: comparisonNotes.kind,
          userId: comparisonNotes.userId,
          authorName: users.name,
          createdAt: comparisonNotes.createdAt,
        })
        .from(comparisonNotes)
        .leftJoin(users, eq(comparisonNotes.userId, users.id))
        .where(eq(comparisonNotes.comparisonId, id))
        .orderBy(asc(comparisonNotes.createdAt));
      return sendJson(response, { notes });
    }

    if (request.method === "POST") {
      const body = NoteSchema.parse(request.body || {});
      const [note] = await db.insert(comparisonNotes).values({
        comparisonId: id,
        userId: auth.userId,
        body: body.body,
        kind: body.kind,
      }).returning();
      captureServerEvent(auth.userId, "comparison_note_created", { comparison_id: id, kind: body.kind });
      return sendJson(response, { note: { ...note, authorName: "You" } }, 201);
    }

    if (request.method === "DELETE") {
      const noteId = Array.isArray(request.query.noteId) ? request.query.noteId[0] : request.query.noteId;
      if (!noteId) return sendJson(response, { error: "Note id is required." }, 400);
      const [existing] = await db.select({ userId: comparisonNotes.userId }).from(comparisonNotes)
        .where(and(eq(comparisonNotes.id, noteId), eq(comparisonNotes.comparisonId, id))).limit(1);
      if (!existing) return sendJson(response, { error: "Note not found." }, 404);
      const mayManage = existing.userId === auth.userId || await canMutateComparison(db, auth.userId, id);
      if (!mayManage) return sendJson(response, { error: "You cannot remove this note." }, 403);
      await db.delete(comparisonNotes).where(eq(comparisonNotes.id, noteId));
      return sendJson(response, { success: true });
    }

    return sendJson(response, { error: "Method not allowed" }, 405);
  } catch (error) {
    return sendJson(response, { error: error instanceof z.ZodError ? error.errors[0]?.message || "Invalid note." : error instanceof Error ? error.message : "Unable to manage notes." }, error instanceof z.ZodError ? 400 : 500);
  }
}
