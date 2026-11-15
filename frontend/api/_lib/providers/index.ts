/**
 * AI Provider Registry
 * Supports DeepSeek, Azure OpenAI / Azure AI Foundry, and OpenRouter with automatic failover.
 */
import { z } from "zod";
import { AzureOpenAIAdapter, isAzureOpenAIConfigured } from "./azure.js";
import { DeepSeekAdapter } from "./deepseek.js";
import { OpenRouterAdapter } from "./openrouter.js";
import type { AIProvider, GenerateOptions, GenerateResult } from "../ai-adapter.js";
import { logger } from "../log.js";

const deepseek = new DeepSeekAdapter();
const azure = new AzureOpenAIAdapter();
const openrouter = new OpenRouterAdapter();

export type RegisteredProviderName = "deepseek" | "azure" | "openrouter";

function isKeyPresent(value?: string): boolean {
  return Boolean(value && value.trim() !== "" && value !== "sk-placeholder");
}

function getOrderedConfiguredProviders(): AIProvider[] {
  const configuredMap: Record<RegisteredProviderName, boolean> = {
    deepseek: isKeyPresent(process.env.DEEPSEEK_API_KEY),
    azure: isAzureOpenAIConfigured(),
    openrouter: isKeyPresent(process.env.OPENROUTER_API_KEY),
  };

  const preferred = process.env.AI_PRIMARY_PROVIDER?.trim().toLowerCase() as
    | RegisteredProviderName
    | undefined;

  const defaultOrder: RegisteredProviderName[] = ["deepseek", "azure", "openrouter"];
  const orderedNames =
    preferred && defaultOrder.includes(preferred)
      ? [preferred, ...defaultOrder.filter((name) => name !== preferred)]
      : defaultOrder;

  const instances: Record<RegisteredProviderName, AIProvider> = {
    deepseek,
    azure,
    openrouter,
  };

  return orderedNames.filter((name) => configuredMap[name]).map((name) => instances[name]);
}

export class FailoverAIProvider implements AIProvider {
  name: string;
  private readonly providers: AIProvider[];

  constructor(providers: AIProvider[]) {
    if (providers.length === 0) {
      throw new Error("FailoverAIProvider requires at least one provider.");
    }
    this.providers = providers;
    this.name = providers[0].name;
  }

  async generateObject<T>(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    schema: z.ZodType<T>,
    options?: GenerateOptions,
  ): Promise<GenerateResult<T>> {
    let lastError: unknown;
    for (let i = 0; i < this.providers.length; i++) {
      const candidate = this.providers[i];
      try {
        return await candidate.generateObject(messages, schema, options);
      } catch (error) {
        lastError = error;
        if (i + 1 < this.providers.length) {
          logger.warn("Primary AI provider failed during generateObject; failing over", {
            failedProvider: candidate.name,
            nextProvider: this.providers[i + 1].name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  async generateText(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    options?: GenerateOptions,
  ): Promise<GenerateResult<string>> {
    let lastError: unknown;
    for (let i = 0; i < this.providers.length; i++) {
      const candidate = this.providers[i];
      try {
        return await candidate.generateText(messages, options);
      } catch (error) {
        lastError = error;
        if (i + 1 < this.providers.length) {
          logger.warn("Primary AI provider failed during generateText; failing over", {
            failedProvider: candidate.name,
            nextProvider: this.providers[i + 1].name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  estimateCost(inputTokens: number, outputTokens: number, model: string): number {
    return this.providers[0].estimateCost(inputTokens, outputTokens, model);
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number }> {
    for (const candidate of this.providers) {
      const result = await candidate.healthCheck();
      if (result.ok) return result;
    }
    return this.providers[0].healthCheck();
  }
}

export function getPrimaryProvider(): AIProvider {
  const configured = getOrderedConfiguredProviders();
  if (configured.length === 0) {
    throw new Error(
      "No AI provider configured. Set DEEPSEEK_API_KEY, AZURE_OPENAI_API_KEY + AZURE_OPENAI_ENDPOINT, or OPENROUTER_API_KEY.",
    );
  }
  if (configured.length === 1) {
    return configured[0];
  }
  return new FailoverAIProvider(configured);
}

export function getProvider(name: RegisteredProviderName): AIProvider {
  if (name === "deepseek") return deepseek;
  if (name === "azure") return azure;
  if (name === "openrouter") return openrouter;
  throw new Error(`Unknown provider: ${name}`);
}

export function listAvailableProviders(): string[] {
  return getOrderedConfiguredProviders().map((p) => p.name);
}

export { deepseek, azure, openrouter };
