/**
 * AI Provider Registry
 * DeepSeek is the default. OpenRouter is available but disabled without key.
 */
import { DeepSeekAdapter } from "./deepseek.js";
import { OpenRouterAdapter } from "./openrouter.js";
import type { AIProvider } from "./ai-adapter.js";

const deepseek = new DeepSeekAdapter();
const openrouter = new OpenRouterAdapter();

export function getPrimaryProvider(): AIProvider {
  if (process.env.DEEPSEEK_API_KEY) {
    return deepseek;
  }
  if (process.env.OPENROUTER_API_KEY) {
    return openrouter;
  }
  throw new Error(
    "No AI provider configured. Set DEEPSEEK_API_KEY or OPENROUTER_API_KEY.",
  );
}

export function getProvider(name: "deepseek" | "openrouter"): AIProvider {
  if (name === "deepseek") return deepseek;
  if (name === "openrouter") return openrouter;
  throw new Error(`Unknown provider: ${name}`);
}

export function listAvailableProviders(): string[] {
  const available: string[] = [];
  if (process.env.DEEPSEEK_API_KEY) available.push("deepseek");
  if (process.env.OPENROUTER_API_KEY) available.push("openrouter");
  return available;
}

export { deepseek, openrouter };
