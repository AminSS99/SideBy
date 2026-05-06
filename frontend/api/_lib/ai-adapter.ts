/**
 * SideBy AI Provider Adapter System
 * Unified interface for all AI providers with Zod validation.
 */
import { z } from "zod";

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json" | "text";
  timeoutMs?: number;
}

export interface GenerateResult<T> {
  data: T;
  raw: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  estimatedCost: number;
}

export interface AIProvider {
  name: string;
  generateObject: <T>(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    schema: z.ZodType<T>,
    options?: GenerateOptions,
  ) => Promise<GenerateResult<T>>;
  generateText: (
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    options?: GenerateOptions,
  ) => Promise<GenerateResult<string>>;
  estimateCost: (inputTokens: number, outputTokens: number, model: string) => number;
  healthCheck: () => Promise<{ ok: boolean; latencyMs: number }>;
}

// ─── Cost models (per 1M tokens) ────────────────────────────────────────────

const COST_TABLE: Record<string, { input: number; output: number }> = {
  "deepseek-chat": { input: 0.14, output: 0.28 },
  "deepseek-reasoner": { input: 0.55, output: 2.19 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "claude-3-5-sonnet": { input: 3.0, output: 15.0 },
  "claude-3-5-haiku": { input: 0.8, output: 4.0 },
  "gemini-2.0-flash": { input: 0.075, output: 0.3 },
};

export function estimateCost(inputTokens: number, outputTokens: number, model: string): number {
  const rates = COST_TABLE[model];
  if (!rates) return 0;
  return (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;
}

export function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for English
  return Math.ceil(text.length / 4);
}

// ─── Zod validation with repair ─────────────────────────────────────────────

export async function validateWithRepair<T>(
  raw: string,
  schema: z.ZodType<T>,
  provider: AIProvider,
  repairModel?: string,
): Promise<T> {
  // First attempt: direct parse
  const cleaned = cleanJson(raw);
  const first = tryParse(cleaned, schema);
  if (first.success) return first.data;

  // Second attempt: repair with cheap model
  console.warn("First parse failed, attempting repair:", (first as { success: false; error: string }).error);

  const repairMessages = [
    {
      role: "system" as const,
      content:
        "You are a JSON repair assistant. Fix the provided broken JSON so it matches the expected schema. Return ONLY valid JSON, no markdown, no explanations.",
    },
    {
      role: "user" as const,
      content: `Fix this broken JSON:\n\n${cleaned}\n\nErrors: ${(first as { success: false; error: string }).error}`,
    },
  ];

  const repairResult = await provider.generateText(repairMessages, {
    model: repairModel,
    temperature: 0.1,
    maxTokens: 4000,
  });

  const repairedCleaned = cleanJson(repairResult.raw);
  const second = tryParse(repairedCleaned, schema);
  if (second.success) return second.data;

  throw new Error(
    `Failed to validate AI output after repair. Errors: ${(second as { success: false; error: string }).error}`,
  );
}

function cleanJson(raw: string): string {
  let cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];

  cleaned = cleaned
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(
      /:\s*"([^"]*?)"/g,
      (_, v: string) => `: "${v.replace(/\n/g, "\\n").replace(/\r/g, "")}"`,
    );

  return cleaned;
}

function tryParse<T>(
  raw: string,
  schema: z.ZodType<T>,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const parsed = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.message };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}
