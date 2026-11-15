import { describe, it, expect, vi, afterEach } from 'vitest';
import { estimateCost, validateWithRepair, type AIProvider } from '../ai-adapter.js'; // Use .js extension for local ESM imports
import { AzureOpenAIAdapter, buildAzureChatCompletionsUrl } from '../providers/azure.js';
import { FailoverAIProvider, getPrimaryProvider, listAvailableProviders } from '../providers/index.js';
import { z } from 'zod';

describe('estimateCost', () => {
  it('calculates cost correctly for a known model (gpt-4o)', () => {
    // gpt-4o: 2.5 input, 10.0 output per 1M tokens
    const cost = estimateCost(1_000_000, 1_000_000, 'gpt-4o');
    expect(cost).toBeCloseTo(12.5);
  });

  it('calculates cost correctly for a known model (deepseek-chat)', () => {
    // deepseek-chat: 0.14 input, 0.28 output per 1M tokens
    const cost = estimateCost(500_000, 2_000_000, 'deepseek-chat');
    // 0.5 * 0.14 + 2 * 0.28 = 0.07 + 0.56 = 0.63
    expect(cost).toBeCloseTo(0.63);
  });

  it('handles zero tokens correctly', () => {
    const cost = estimateCost(0, 0, 'gpt-4o-mini');
    expect(cost).toBe(0);
  });

  it('handles small token counts correctly', () => {
    // gpt-4o-mini: 0.15 input, 0.6 output per 1M tokens
    // 1000 input, 2000 output
    // 0.001 * 0.15 + 0.002 * 0.6 = 0.00015 + 0.0012 = 0.00135
    const cost = estimateCost(1_000, 2_000, 'gpt-4o-mini');
    expect(cost).toBeCloseTo(0.00135);
  });

  it('returns 0 for an unknown model', () => {
    const cost = estimateCost(1_000_000, 1_000_000, 'unknown-model');
    expect(cost).toBe(0);
  });

  it('calculates cost correctly when input tokens are zero but output tokens exist', () => {
    // gpt-4o: 2.5 input, 10.0 output per 1M tokens
    const cost = estimateCost(0, 1_000_000, 'gpt-4o');
    expect(cost).toBeCloseTo(10.0);
  });

  it('calculates cost correctly when output tokens are zero but input tokens exist', () => {
    // gpt-4o: 2.5 input, 10.0 output per 1M tokens
    const cost = estimateCost(1_000_000, 0, 'gpt-4o');
    expect(cost).toBeCloseTo(2.5);
  });
});

const stubProvider: AIProvider = {
  name: 'stub',
  generateObject: async () => {
    throw new Error('not used in these tests');
  },
  generateText: async (messages) => {
    const raw = messages[messages.length - 1]?.content ?? '';
    return {
      data: raw,
      raw,
      model: 'stub-model',
      provider: 'stub',
      inputTokens: 1,
      outputTokens: 1,
      latencyMs: 0,
      estimatedCost: 0,
    };
  },
  estimateCost: () => 0,
  healthCheck: async () => ({ ok: true, latencyMs: 0 }),
};

describe('validateWithRepair normalization', () => {
  const FactSchema = z.object({
    entity: z.string(),
    dimension: z.string(),
    value: z.string(),
    confidence: z.number().min(0).max(1),
  });

  it('unwraps an object-wrapped array instead of failing with "Expected array, received object"', async () => {
    const raw = JSON.stringify({
      facts: [
        { entity: 'React', dimension: 'Performance', value: 'Fast', confidence: 0.9 },
        { entity: 'Vue', dimension: 'Performance', value: 'Fast', confidence: 0.85 },
      ],
    });

    const result = await validateWithRepair(raw, z.array(FactSchema), stubProvider);
    expect(result).toHaveLength(2);
    expect(result[0].entity).toBe('React');
  });

  it('converts numeric-keyed objects into arrays', async () => {
    const raw = JSON.stringify({
      '0': { entity: 'A', dimension: 'Price', value: '$0', confidence: 0.5 },
      '1': { entity: 'B', dimension: 'Price', value: '$1', confidence: 0.6 },
    });

    const result = await validateWithRepair(raw, z.array(FactSchema), stubProvider);
    expect(result).toHaveLength(2);
  });

  it('coerces string-encoded numbers as a last resort', async () => {
    const raw = JSON.stringify([
      { entity: 'React', dimension: 'Maturity', value: 'High', confidence: '0.8' },
    ]);

    const result = await validateWithRepair(raw, z.array(FactSchema), stubProvider);
    expect(result[0].confidence).toBe(0.8);
  });

  it('finds arrays nested below the top level', async () => {
    const raw = JSON.stringify({
      meta: { requested: 'facts' },
      data: {
        items: [
          { entity: 'React', dimension: 'Ecosystem', value: 'Large', confidence: 0.7 },
        ],
      },
    });

    const result = await validateWithRepair(raw, z.array(FactSchema), stubProvider);
    expect(result).toHaveLength(1);
    expect(result[0].dimension).toBe('Ecosystem');
  });

  it('falls back to the repair model when nothing parses and still validates the repair', async () => {
    const generateText = vi.fn().mockResolvedValue({
      data: '[{"entity":"React","dimension":"DX","value":"Good","confidence":0.9}]',
      raw: '[{"entity":"React","dimension":"DX","value":"Good","confidence":0.9}]',
      model: 'repair-model',
      provider: 'stub',
      inputTokens: 1,
      outputTokens: 1,
      latencyMs: 0,
      estimatedCost: 0,
    });
    const provider = { ...stubProvider, generateText };

    const result = await validateWithRepair('not json at all', z.array(FactSchema), provider);
    expect(generateText).toHaveBeenCalledOnce();
    expect(result[0].entity).toBe('React');
  });

  it('throws a descriptive error when both parse and repair fail', async () => {
    const provider: AIProvider = {
      ...stubProvider,
      generateText: async () => ({
        data: 'still broken',
        raw: 'still broken',
        model: 'stub-model',
        provider: 'stub',
        inputTokens: 1,
        outputTokens: 1,
        latencyMs: 0,
        estimatedCost: 0,
      }),
    };

    await expect(
      validateWithRepair('not json at all', z.array(FactSchema), provider),
    ).rejects.toThrow(/Failed to validate AI output after repair/);
  });
});

describe('AzureOpenAIAdapter & FailoverAIProvider', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('builds standard Azure OpenAI deployment chat completions URL', () => {
    const url = buildAzureChatCompletionsUrl(
      'https://sideby-ai.openai.azure.com/',
      'gpt-4o-mini',
      '2024-10-21',
    );
    expect(url).toBe(
      'https://sideby-ai.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-10-21',
    );
  });

  it('preserves full Azure AI Foundry chat completions URL when already specified', () => {
    const url = buildAzureChatCompletionsUrl(
      'https://sideby-foundry.services.ai.azure.com/models/chat/completions',
      'gpt-4o-mini',
      '2024-10-21',
    );
    expect(url).toBe(
      'https://sideby-foundry.services.ai.azure.com/models/chat/completions?api-version=2024-10-21',
    );
  });

  it('appends /chat/completions without api-version for Azure Foundry /openai/v1 endpoints', () => {
    const url = buildAzureChatCompletionsUrl(
      'https://snapeco1-resource.openai.azure.com/openai/v1/',
      'Llama-3.3-70B-Instruct',
      '2024-10-21',
    );
    expect(url).toBe(
      'https://snapeco1-resource.openai.azure.com/openai/v1/chat/completions',
    );
  });

  it('registers azure in listAvailableProviders and honors AI_PRIMARY_PROVIDER=azure', () => {
    process.env.DEEPSEEK_API_KEY = 'sk-deepseek-test';
    process.env.AZURE_OPENAI_API_KEY = 'az-key-test';
    process.env.AZURE_OPENAI_ENDPOINT = 'https://sideby-ai.openai.azure.com';
    process.env.AI_PRIMARY_PROVIDER = 'azure';

    expect(listAvailableProviders()).toEqual(['azure', 'deepseek']);
    expect(getPrimaryProvider().name).toBe('azure');
  });

  it('fails over from primary provider to Azure when primary throws', async () => {
    const failingPrimary: AIProvider = {
      ...stubProvider,
      name: 'deepseek',
      generateText: vi.fn().mockRejectedValue(new Error('DeepSeek 503 Unavailable')),
    };
    const azureFallback: AIProvider = {
      ...stubProvider,
      name: 'azure',
      generateText: vi.fn().mockResolvedValue({
        data: 'ok from azure',
        raw: 'ok from azure',
        model: 'gpt-4o-mini',
        provider: 'azure',
        inputTokens: 5,
        outputTokens: 3,
        latencyMs: 42,
        estimatedCost: 0.0001,
      }),
    };

    const failover = new FailoverAIProvider([failingPrimary, azureFallback]);
    const result = await failover.generateText([{ role: 'user', content: 'ping' }]);
    expect(result.provider).toBe('azure');
    expect(result.data).toBe('ok from azure');
    expect(failingPrimary.generateText).toHaveBeenCalledOnce();
    expect(azureFallback.generateText).toHaveBeenCalledOnce();
  });

  it('sends api-key header and parses completion from AzureOpenAIAdapter', async () => {
    process.env.AZURE_OPENAI_API_KEY = 'az-test-secret';
    process.env.AZURE_OPENAI_ENDPOINT = 'https://sideby-ai.openai.azure.com';
    process.env.AZURE_OPENAI_DEPLOYMENT = 'gpt-4o-mini';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"status":"healthy"}' } }],
          usage: { prompt_tokens: 12, completion_tokens: 6 },
          model: 'gpt-4o-mini',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const adapter = new AzureOpenAIAdapter();
    const res = await adapter.generateText([{ role: 'user', content: 'check' }], {
      responseFormat: 'json',
    });

    expect(res.provider).toBe('azure');
    expect(res.raw).toBe('{"status":"healthy"}');
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [calledUrl, init] = fetchSpy.mock.calls[0];
    expect(String(calledUrl)).toContain('/openai/deployments/gpt-4o-mini/chat/completions');
    expect((init?.headers as Record<string, string>)['api-key']).toBe('az-test-secret');
  });
});
