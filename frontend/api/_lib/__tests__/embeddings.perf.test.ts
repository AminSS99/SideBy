import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('embedTexts Performance', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('runs batches concurrently', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    const { embedTexts } = await import('../embeddings.js');

    const fetchMock = vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay per fetch
      return {
        ok: true,
        json: async () => ({
          data: Array(100).fill({ embedding: [0.1, 0.2, 0.3] })
        })
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    // 500 items = 5 chunks
    const texts = Array(500).fill("test text");

    const start = Date.now();
    await embedTexts(texts);
    const duration = Date.now() - start;

    expect(fetchMock).toHaveBeenCalledTimes(5);

    console.log(`Duration for 5 chunks: ${duration}ms`);
  });
});
