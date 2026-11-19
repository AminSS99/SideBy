/**
 * Export engine for SideBy comparisons.
 * Supports Markdown and JSON exports.
 */
import { eq } from "drizzle-orm";
import { createDbClient } from "../../src/db/index.js";
import {
  comparisons,
  comparisonEntities,
  comparisonDimensions,
  comparisonSources,
  comparisonFacts,
  comparisonScores,
  comparisonVerdicts,
  comparisonQuestions,
} from "../../src/db/schema.js";
import { canAccessComparison, canAccessWorkspace } from "./db-auth.js";
import { httpUrlOrNull } from "./safe-url.js";
import { analyzeComparisonQuery, summarizeComparisonTaxonomy } from "../../src/lib/comparisonTaxonomy.js";

function escapeMarkdownLinkText(text: string): string {
  return text.replace(/[[\]()\\]/g, "\\$&");
}

export async function exportComparison(
  comparisonId: string,
  userId: string,
  format: "markdown" | "json",
  requiredWorkspaceId: string | null = null,
) {
  const db = createDbClient();

  const hasAccess = await canAccessComparison(db, userId, comparisonId);
  if (!hasAccess) {
    throw Object.assign(new Error("Comparison not found."), { statusCode: 404 });
  }

  const [comp] = await db
    .select()
    .from(comparisons)
    .where(eq(comparisons.id, comparisonId))
    .limit(1);

  if (!comp || (requiredWorkspaceId && comp.workspaceId !== requiredWorkspaceId)) {
    throw Object.assign(new Error("Comparison not found."), { statusCode: 404 });
  }

  const isMember =
    comp.clerkUserId === userId ||
    (comp.workspaceId ? await canAccessWorkspace(db, userId, comp.workspaceId) : false);

  const entities = await db
    .select()
    .from(comparisonEntities)
    .where(eq(comparisonEntities.comparisonId, comparisonId));

  const dimensions = await db
    .select()
    .from(comparisonDimensions)
    .where(eq(comparisonDimensions.comparisonId, comparisonId));

  const sources = await db
    .select()
    .from(comparisonSources)
    .where(eq(comparisonSources.comparisonId, comparisonId));

  const facts = await db
    .select()
    .from(comparisonFacts)
    .where(eq(comparisonFacts.comparisonId, comparisonId));

  const scores = await db
    .select()
    .from(comparisonScores)
    .where(eq(comparisonScores.comparisonId, comparisonId));

  const [verdict] = await db
    .select()
    .from(comparisonVerdicts)
    .where(eq(comparisonVerdicts.comparisonId, comparisonId))
    .limit(1);

  const questions = isMember
    ? await db
        .select({
          id: comparisonQuestions.id,
          question: comparisonQuestions.question,
          answer: comparisonQuestions.answer,
          groundedIn: comparisonQuestions.groundedIn,
          answeredAt: comparisonQuestions.answeredAt,
          createdAt: comparisonQuestions.createdAt,
        })
        .from(comparisonQuestions)
        .where(eq(comparisonQuestions.comparisonId, comparisonId))
    : [];

  if (format === "json") {
    const safeComparison = {
      id: comp.id,
      query: comp.query,
      slug: comp.slug,
      status: comp.status,
      visibility: comp.visibility,
      sourceCount: comp.sourceCount,
      factsCount: comp.factsCount,
      dimensionsCount: comp.dimensionsCount,
      overallConfidence: comp.overallConfidence,
      freshnessClass: comp.freshnessClass,
      taxonomyCategory: comp.taxonomyCategory,
      result: comp.result,
      createdAt: comp.createdAt,
      updatedAt: comp.updatedAt,
    };
    return {
      comparison: safeComparison,
      entities,
      dimensions,
      sources,
      facts: facts.map(({ embedding: _embedding, ...rest }) => rest),
      scores,
      verdict,
      questions,
      exportedAt: new Date().toISOString(),
    };
  }

  // Markdown export
  const entityNames = entities.map((e) => e.normalizedName).join(" vs ");
  const taxonomy = (comp.result as { taxonomy?: ReturnType<typeof summarizeComparisonTaxonomy> } | null)?.taxonomy ||
    summarizeComparisonTaxonomy(analyzeComparisonQuery(comp.query));
  let md = `# SideBy Comparison: ${entityNames}\n\n`;
  md += `**Query:** ${comp.query}\n`;
  md += `**Category:** ${taxonomy.label}\n`;
  md += `**Status:** ${comp.status}\n`;
  md += `**Sources:** ${sources.length}\n`;
  md += `**Exported:** ${new Date().toLocaleString()}\n\n`;
  if (taxonomy.disclaimer) {
    md += `> ${taxonomy.disclaimer}\n\n`;
  }

  if (verdict) {
    md += `## Verdict\n\n`;
    if (verdict.title) {
      md += `### ${verdict.title}\n\n`;
    }
    md += `${verdict.body || "No verdict available."}\n\n`;
    if (verdict.confidence) {
      md += `**Confidence:** ${verdict.confidence}\n\n`;
    }
  }

  if (dimensions.length > 0) {
    md += `## Dimensions\n\n`;
    for (const dim of dimensions) {
      md += `### ${dim.name}\n`;
      if (dim.description) md += `${dim.description}\n`;

      const dimScores = scores.filter((s) => s.dimensionId === dim.id);
      for (const s of dimScores) {
        md += `- **Score:** ${s.score}/100 — ${s.rationale || "No rationale"}\n`;
      }
      md += `\n`;
    }
  }

  if (facts.length > 0) {
    md += `## Facts\n\n`;
    for (const fact of facts) {
      md += `- ${fact.value} (confidence: ${fact.confidence})\n`;
    }
    md += `\n`;
  }

  if (sources.length > 0) {
    md += `## Sources\n\n`;
    for (const source of sources) {
      const safeTitle = escapeMarkdownLinkText(source.title || "Untitled");
      const safeUrl = httpUrlOrNull(source.url);
      if (safeUrl) {
        md += `- [${safeTitle}](${safeUrl}) — ${source.reliability || "unknown reliability"}\n`;
      } else {
        md += `- ${safeTitle} — ${source.reliability || "unknown reliability"}\n`;
      }
    }
    md += `\n`;
  }

  if (questions.length > 0) {
    md += `## Follow-up Questions\n\n`;
    for (const q of questions) {
      md += `**Q:** ${q.question}\n`;
      md += `**A:** ${q.answer || "No answer yet."}\n\n`;
    }
  }

  md += `---\n*Generated by SideBy — Source-backed AI comparisons*\n`;

  return { markdown: md, format: "markdown" as const };
}
