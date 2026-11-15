/**
 * Azure OpenAI / Azure AI Foundry Provider Adapter
 * Supports both classic Azure OpenAI deployments and Azure AI Foundry endpoints.
 */
import { z } from "zod";
import type { AIProvider, GenerateOptions, GenerateResult } from "../ai-adapter.js";
import { estimateCost, estimateTokens, validateWithRepair, withOutputContract } from "../ai-adapter.js";

const DEFAULT_API_VERSION = "2024-10-21";
const DEFAULT_DEPLOYMENT = "gpt-4o-mini";

export function isAzureOpenAIConfigured(): boolean {
  const key = process.env.AZURE_OPENAI_API_KEY?.trim();
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  return Boolean(key && key !== "sk-placeholder" && endpoint);
}

export function buildAzureChatCompletionsUrl(
  endpointRaw: string,
  deploymentRaw?: string,
  apiVersionRaw?: string,
): string {
  const endpoint = endpointRaw.trim().replace(/\/+$/, "");
  const deployment = (deploymentRaw || process.env.AZURE_OPENAI_DEPLOYMENT || DEFAULT_DEPLOYMENT).trim();
  const apiVersion = (apiVersionRaw || process.env.AZURE_OPENAI_API_VERSION || DEFAULT_API_VERSION).trim();

  if (endpoint.includes("/chat/completions")) {
    if (endpoint.includes("api-version=")) {
      return endpoint;
    }
    const separator = endpoint.includes("?") ? "&" : "?";
    return `${endpoint}${separator}api-version=${encodeURIComponent(apiVersion)}`;
  }

  return `${endpoint}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;
}

export class AzureOpenAIAdapter implements AIProvider {
  name = "azure";

  private assertConfigured(): { apiKey: string; endpoint: string; deployment: string; apiVersion: string } {
    const apiKey = process.env.AZURE_OPENAI_API_KEY?.trim();
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim();
    if (!apiKey || !endpoint) {
      throw new Error(
        "Azure OpenAI adapter is not configured. Set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT.",
      );
    }
    return {
      apiKey,
      endpoint,
      deployment: (process.env.AZURE_OPENAI_DEPLOYMENT || DEFAULT_DEPLOYMENT).trim(),
      apiVersion: (process.env.AZURE_OPENAI_API_VERSION || DEFAULT_API_VERSION).trim(),
    };
  }

  async generateObject<T>(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    schema: z.ZodType<T>,
    options?: GenerateOptions,
  ): Promise<GenerateResult<T>> {
    this.assertConfigured();
    const textResult = await this.generateText(withOutputContract(messages, schema), {
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
    const { apiKey, endpoint, deployment, apiVersion } = this.assertConfigured();
    const activeDeployment = options?.model || deployment;
    const url = buildAzureChatCompletionsUrl(endpoint, activeDeployment, apiVersion);
    const startTime = Date.now();

    const inputText = messages.map((m) => m.content).join("\n");
    const inputTokens = estimateTokens(inputText);

    const controller = new AbortController();
    const timeout = options?.timeoutMs || 60000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: activeDeployment,
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
        throw new Error(`Azure OpenAI error ${response.status}: ${text.slice(0, 200)}`);
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
      const costModel = data.model || activeDeployment;

      return {
        data: raw,
        raw,
        model: costModel,
        provider: this.name,
        inputTokens: actualInputTokens,
        outputTokens,
        latencyMs,
        estimatedCost: estimateCost(actualInputTokens, outputTokens, costModel),
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
