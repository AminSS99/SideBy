import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildAzureEmbeddingUrl, cosineSimilarity, embedText } from '../embeddings.js';

describe('cosineSimilarity', () => {
  it('throws an error if vectors have different dimensions', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow('Vectors must have the same dimension.');
  });

  it('returns 1 for identical vectors', () => {
    const v = [1, 2, 3];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1);
  });

  it('returns -1 for opposite vectors', () => {
    const a = [1, 2, 3];
    const b = [-1, -2, -3];
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1);
  });

  it('returns 0 for orthogonal vectors', () => {
    const a = [1, 0];
    const b = [0, 1];
    expect(cosineSimilarity(a, b)).toBeCloseTo(0);
  });

  it('computes correct similarity for normal vectors', () => {
    const a = [1, 2, 3];
    const b = [4, 5, 6];
    // a = [1,2,3], normA = sqrt(14)
    // b = [4,5,6], normB = sqrt(77)
    // dot = 4 + 10 + 18 = 32
    // sim = 32 / sqrt(14 * 77) = 32 / sqrt(1078) ≈ 0.9746318
    expect(cosineSimilarity(a, b)).toBeCloseTo(0.9746318, 5);
  });

  it('returns 0 if either vector has a norm of 0 (all zeros)', () => {
    const a = [0, 0, 0];
    const b = [1, 2, 3];
    expect(cosineSimilarity(a, b)).toBe(0);
    expect(cosineSimilarity(b, a)).toBe(0);
    expect(cosineSimilarity(a, a)).toBe(0);
  });

  it('returns 0 for empty vectors', () => {
    expect(cosineSimilarity([], [])).toBe(0);
  });
});

describe('Azure OpenAI embeddings & failover', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('builds Azure OpenAI embeddings deployment URL', () => {
    const url = buildAzureEmbeddingUrl(
      'https://sideby-ai.openai.azure.com/',
      'text-embedding-3-small',
      '2024-10-21',
    );
    expect(url).toBe(
      'https://sideby-ai.openai.azure.com/openai/deployments/text-embedding-3-small/embeddings?api-version=2024-10-21',
    );
  });

  it('uses Azure OpenAI embeddings when OPENAI_API_KEY is not set', async () => {
    delete process.env.OPENAI_API_KEY;
    process.env.AZURE_OPENAI_API_KEY = 'az-embed-key';
    process.env.AZURE_OPENAI_ENDPOINT = 'https://sideby-ai.openai.azure.com';
    process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT = 'text-embedding-3-small';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const vector = await embedText('React vs Vue performance');
    expect(vector).toEqual([0.1, 0.2, 0.3]);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [calledUrl, init] = fetchSpy.mock.calls[0];
    expect(String(calledUrl)).toContain('/openai/deployments/text-embedding-3-small/embeddings');
    expect((init?.headers as Record<string, string>)['api-key']).toBe('az-embed-key');
  });

  it('fails over from OpenAI to Azure OpenAI embeddings when OpenAI returns 429/500', async () => {
    process.env.OPENAI_API_KEY = 'sk-openai-test';
    process.env.AZURE_OPENAI_API_KEY = 'az-embed-key';
    process.env.AZURE_OPENAI_ENDPOINT = 'https://sideby-ai.openai.azure.com';

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('Quota exceeded', { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ embedding: [0.4, 0.5, 0.6] }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );

    const vector = await embedText('Postgres vs MySQL');
    expect(vector).toEqual([0.4, 0.5, 0.6]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
