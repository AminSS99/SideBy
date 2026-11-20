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

export type SelectableModel = {
  id: string;
  label: string;
  provider: string;
  model: string;
  badge?: string;
};

export function listSelectableModels(): SelectableModel[] {
  const models: SelectableModel[] = [
    { id: "auto", label: "Auto (Best Available)", provider: "auto", model: "auto" },
  ];

  if (isKeyPresent(process.env.DEEPSEEK_API_KEY)) {
    const dsModel = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-flash";
    models.push({
      id: `deepseek:${dsModel}`,
      label: dsModel === "deepseek-flash" ? "DeepSeek 4.1 Flash (1017)" : `DeepSeek (${dsModel})`,
      provider: "deepseek",
      model: dsModel,
      badge: "Fast",
    });
  }

  if (isAzureOpenAIConfigured()) {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim() || "";
    const defaultDeployment = process.env.AZURE_OPENAI_DEPLOYMENT?.trim() || "gpt-4o-mini";
    const seenAzure = new Set<string>();
    const addAzure = (deployment: string, label: string, badge?: string) => {
      if (seenAzure.has(deployment)) return;
      seenAzure.add(deployment);
      models.push({ id: `azure:${deployment}`, label, provider: "azure", model: deployment, badge });
    };

    addAzure(defaultDeployment, defaultDeployment, "Azure");
    if (endpoint.includes("/openai/v1")) {
      addAzure("Llama-3.3-70B-Instruct", "Llama 3.3 70B", "Azure");
      addAzure("Kimi-K2.5", "Kimi K2.5", "Azure");
      addAzure("Kimi-K2.6", "Kimi K2.6", "Azure");
    }
  }

  if (isKeyPresent(process.env.OPENAI_API_KEY)) {
    const m = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    models.push({ id: `openai:${m}`, label: m, provider: "openai", model: m });
  }

  if (isKeyPresent(process.env.ANTHROPIC_API_KEY)) {
    const m = process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-haiku-latest";
    models.push({ id: `anthropic:${m}`, label: "Claude Haiku", provider: "anthropic", model: m });
  }

  if (isKeyPresent(process.env.GEMINI_API_KEY)) {
    const m = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
    models.push({ id: `gemini:${m}`, label: "Gemini Flash", provider: "gemini", model: m });
  }

  if (isKeyPresent(process.env.OPENROUTER_API_KEY)) {
    const m = process.env.OPENROUTER_MODEL?.trim() || "deepseek/deepseek-chat";
    models.push({ id: `openrouter:${m}`, label: "OpenRouter", provider: "openrouter", model: m });
  }

  return models;
}

export function resolveProviderForModelId(modelId?: string): { provider: AIProvider; model?: string } {
  const trimmed = modelId?.trim();
  if (!trimmed || trimmed === "auto") {
    return { provider: getPrimaryProvider() };
  }
  const sep = trimmed.indexOf(":");
  if (sep <= 0) {
    return { provider: getPrimaryProvider() };
  }
  const providerName = trimmed.slice(0, sep);
  const modelName = trimmed.slice(sep + 1).trim();
  if (!modelName) {
    return { provider: getPrimaryProvider() };
  }
  if (providerName === "deepseek" && isKeyPresent(process.env.DEEPSEEK_API_KEY)) {
    return { provider: deepseek, model: modelName };
  }
  if (providerName === "azure" && isAzureOpenAIConfigured()) {
    return { provider: azure, model: modelName };
  }
  if (providerName === "openrouter" && isKeyPresent(process.env.OPENROUTER_API_KEY)) {
    return { provider: openrouter, model: modelName };
  }
  return { provider: getPrimaryProvider() };
}

export { deepseek, azure, openrouter };
