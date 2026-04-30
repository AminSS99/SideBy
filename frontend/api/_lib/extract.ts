import { llmChat, isLLMAvailable } from "./llm.js";
import type { LLMMessage } from "./llm.js";

type EntityKey = "a" | "b";

type ExtractedFact = {
  entity: EntityKey;
  category: string;
  label: string;
  value: string;
  confidence: number;
  freshness_class: "pricing" | "product" | "static";
};

type ExtractedCategory = {
  name: string;
  winner: EntityKey | "tie";
  verdict: string;
  facts: ExtractedFact[];
};

type ExtractedVerdict = {
  bestOverall: string;
  bestValue: string;
  developers: string;
  teams: string;
  students: string;
  powerUsers: string;
  ecosystem: string;
  summary: string;
};

type ExtractedDimension = {
  subject: string;
  a: number;
  b: number;
  fullMark: number;
};

type ExtractedComparison = {
  categories: ExtractedCategory[];
  verdict: ExtractedVerdict;
  context: string;
  dimensions: ExtractedDimension[];
  consensus: string[];
  contradictions: string[];
};

type SourceContent = {
  entity: string;
  entityKey: EntityKey;
  content: string;
};

const SYSTEM_PROMPT = `You are SideBy, a premium AI comparison research engine. Your job is to analyze raw web-scraped content about two products/services and produce a structured, source-backed comparison.

Rules:
1. Only use facts that can be traced back to the provided source content. Never hallucinate.
2. If a fact cannot be confirmed from the sources, mark confidence as <0.5 and note it.
3. Pricing facts should have freshness_class "pricing" and be treated as fast-changing.
4. Product capability facts should have freshness_class "product".
5. Stable background facts (history, founding, architecture style) should have freshness_class "static".
6. Each fact must have an entity (a or b), category, label, and value.
7. Generate 4-6 comparison categories relevant to the products being compared.
8. For each category, determine a winner (a, b, or tie) and write a one-sentence verdict.
9. Generate a nuanced final verdict with awards for: bestOverall, bestValue, developers, teams, students, powerUsers, ecosystem.
10. Write a 2-3 sentence verdict summary.
11. If pricing is unclear from sources, say "not confirmed from official source" in the verdict.
12. Confidence scores: 0.9+ for direct official source quotes, 0.7-0.89 for inferred from documentation, <0.7 for community/indirect.
13. Generate exactly 6 comparison dimensions for a radar chart (e.g., "Pricing Value", "Dev Experience", "Ecosystem", "Scalability", "Security", "Portability"). Rate both 'a' and 'b' from 0 to 100 (fullMark: 100).
14. Generate an array of 3 'consensus' strings (where sources strongly agree).
15. Generate an array of 2 'contradictions' strings (where sources conflict or are unclear).

Return valid JSON only, with this exact structure:
{
  "context": "brief context of this comparison",
  "dimensions": [
    { "subject": "Pricing Value", "a": 85, "b": 90, "fullMark": 100 }
  ],
  "consensus": ["Point of agreement 1", "Point of agreement 2", "Point of agreement 3"],
  "contradictions": ["Point of conflict 1", "Point of conflict 2"],
  "categories": [
    {
      "name": "Category Name",
      "winner": "a" | "b" | "tie",
      "verdict": "One sentence explaining why",
      "facts": [
        {
          "entity": "a" | "b",
          "category": "Category Name",
          "label": "Short fact label (e.g. Free tier limit)",
          "value": "The actual fact value",
          "confidence": 0.85,
          "freshness_class": "pricing" | "product" | "static"
        }
      ]
    }
  ],
  "verdict": {
    "bestOverall": "Entity name",
    "bestValue": "Entity name",
    "developers": "Entity name",
    "teams": "Entity name",
    "students": "Entity name or 'Depends on usage'",
    "powerUsers": "Entity name",
    "ecosystem": "Entity name",
    "summary": "2-3 sentence nuanced summary"
  }
}`;

const buildUserPrompt = (
  entityA: string,
  entityB: string,
  sources: SourceContent[],
  context: string,
) => {
  const sourceBlocks = sources
    .map(
      (s) =>
        `### ${s.entity} (entity "${s.entityKey}")\nSource content:\n${s.content.slice(0, 6000)}`,
    )
    .join("\n\n---\n\n");

  return `Compare ${entityA} vs ${entityB} ${context}.

Use ONLY the source content below. Do not use your own knowledge.

${sourceBlocks}

Analyze these products and produce the comparison JSON. Remember: only use facts visible in the source content above.`;
};

const parseLLMJson = (content: string): ExtractedComparison => {
  let cleaned = content
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];

  cleaned = cleaned
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/:\s*"([^"]*?)"/g, (_, v) => `: "${v.replace(/\n/g, "\\n").replace(/\r/g, "")}"`);

  try {
    return validate(JSON.parse(cleaned) as ExtractedComparison);
  } catch {
    try {
      const repaired = cleaned
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
        .replace(/:\s*'([^']*)'/g, ': "$1"');
      return validate(JSON.parse(repaired) as ExtractedComparison);
    } catch (e2) {
      console.error("Failed to parse LLM JSON:", cleaned.slice(0, 500));
      throw e2;
    }
  }
};

const validate = (parsed: ExtractedComparison): ExtractedComparison => {
  parsed.categories = (parsed.categories || []).map((cat) => ({
    ...cat,
    winner: cat.winner === "a" || cat.winner === "b" ? cat.winner : "tie",
    facts: (cat.facts || []).map((f) => ({
      ...f,
      entity: f.entity === "a" || f.entity === "b" ? f.entity : ("a" as EntityKey),
      confidence: Number(f.confidence) || 0.7,
      freshness_class: f.freshness_class || "product",
    })),
  }));

  if (!parsed.verdict) {
    parsed.verdict = {
      bestOverall: "", bestValue: "", developers: "", teams: "",
      students: "", powerUsers: "", ecosystem: "", summary: "",
    };
  }

  if (!parsed.dimensions || !Array.isArray(parsed.dimensions)) {
    parsed.dimensions = [
      { subject: "Pricing Value", a: 80, b: 80, fullMark: 100 },
      { subject: "Dev Experience", a: 80, b: 80, fullMark: 100 },
      { subject: "Ecosystem", a: 80, b: 80, fullMark: 100 },
      { subject: "Scalability", a: 80, b: 80, fullMark: 100 },
      { subject: "Security", a: 80, b: 80, fullMark: 100 },
      { subject: "Vendor Lock-in", a: 80, b: 80, fullMark: 100 },
    ];
  }

  if (!parsed.consensus || !Array.isArray(parsed.consensus)) parsed.consensus = [];
  if (!parsed.contradictions || !Array.isArray(parsed.contradictions)) parsed.contradictions = [];

  return parsed;
};

export const extractComparisonFacts = async (
  entityA: string,
  entityB: string,
  sources: SourceContent[],
  context: string,
): Promise<ExtractedComparison> => {
  if (!isLLMAvailable()) {
    throw new Error("No LLM configured for fact extraction.");
  }

  const messages: LLMMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(entityA, entityB, sources, context) },
  ];

  const response = await llmChat(messages);
  return parseLLMJson(response.content);
};

export type {
  ExtractedFact,
  ExtractedCategory,
  ExtractedVerdict,
  ExtractedComparison,
  SourceContent,
  EntityKey,
};