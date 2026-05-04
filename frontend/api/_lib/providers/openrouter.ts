/**
 * OpenRouter AI Provider Adapter
 * Prepared but disabled until OPENROUTER_API_KEY is provided.
 */
import { z } from "zod";
import type { AIProvider, GenerateOptions, GenerateResult } from "../ai-adapter";
import { estimateCost, estimateTokens, validateWithRepair } from "../ai-adapter";

const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat";

export class OpenRouterAdapter implements AIProvider {
  name = "openrouter";

  private assertConfigured() {
    if (!OPENROUTER_API_KEY) {
      throw new Error(
        "OpenRouter adapter is prepared but disabled. Set OPENROUTER_API_KEY to enable.",
      );
    }
  }

  async generateObject<T>(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    schema: z.ZodType<T>,
    options?: GenerateOptions,
  ): Promise<GenerateResult<T>> {
    this.assertConfigured();
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
    this.assertConfigured();

    const model = options?.model || DEFAULT_MODEL;
    const startTime = Date.now();

    const inputText = messages.map((m) => m.content).join("\n");
    const inputTokens = estimateTokens(inputText);

    const controller = new AbortController();
    const timeout = options?.timeoutMs || 60000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:5173",
          "X-Title": "SideBy",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.3,
          max_tokens: options?.maxTokens ?? 4000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`OpenRouter error ${response.status}: ${text.slice(0, 200)}`);
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
