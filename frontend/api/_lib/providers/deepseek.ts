/**
 * DeepSeek AI Provider Adapter
 */
import { z } from "zod";
import type { AIProvider, GenerateOptions, GenerateResult } from "./ai-adapter";
import { estimateCost, estimateTokens, validateWithRepair } from "./ai-adapter";

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export class DeepSeekAdapter implements AIProvider {
  name = "deepseek";

  async generateObject<T>(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    schema: z.ZodType<T>,
    options?: GenerateOptions,
  ): Promise<GenerateResult<T>> {
    const textResult = await this.generateText(messages, {
      ...options,
      responseFormat: "json",
    });

    const data = await validateWithRepair(textResult.raw, schema, this, options?.model);

    return {
      ...textResult,
      data,
    };
  }

  async generateText(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    options?: GenerateOptions,
  ): Promise<GenerateResult<string>> {
    if (!DEEPSEEK_API_KEY) {
      throw new Error("DeepSeek API key not configured.");
    }

    const model = options?.model || DEFAULT_MODEL;
    const startTime = Date.now();

    const inputText = messages.map((m) => m.content).join("\n");
    const inputTokens = estimateTokens(inputText);

    const controller = new AbortController();
    const timeout = options?.timeoutMs || 60000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.3,
          max_tokens: options?.maxTokens ?? 4000,
          response_format: options?.responseFormat === "json" ? { type: "json_object" } : undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`DeepSeek error ${response.status}: ${text.slice(0, 200)}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens: number; completion_tokens: number };
        model?: string;
      };

      const raw = data.choices[0]?.message?.content || "";
      const latencyMs = Date.now() - startTime;
      const outputTokens = data.usage?.completion_tokens || estimateTokens(raw);
      const actualInputTokens = data.usage?.prompt_tokens || inputTokens;

      return {
        data: raw,
        raw,
        model: data.model || model,
        provider: this.name,
        inputTokens: actualInputTokens,
        outputTokens,
        latencyMs,
        estimatedCost: estimateCost(actualInputTokens, outputTokens, model),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  estimateCost(inputTokens: number, outputTokens: number, model: string): number {
    return estimateCost(inputTokens, outputTokens, model);
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.generateText(
        [{ role: "user", content: "Say 'ok'" }],
        { maxTokens: 10, timeoutMs: 10000 },
      );
      return { ok: true, latencyMs: Date.now() - start };
    } catch {
      return { ok: false, latencyMs: Date.now() - start };
    }
  }
}
