import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('api-key-auth', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe('hashApiKey', () => {
    it('should be deterministic (same input produces same hash)', async () => {
      vi.stubEnv('API_KEY_PEPPER', 'test-pepper');
      const { hashApiKey } = await import('../api-key-auth.js');

      const secret = 'my-secret-key';
      const hash1 = hashApiKey(secret);
      const hash2 = hashApiKey(secret);

      expect(hash1).toBe(hash2);
      expect(hash1).toBeTypeOf('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for different inputs', async () => {
      vi.stubEnv('API_KEY_PEPPER', 'test-pepper');
      const { hashApiKey } = await import('../api-key-auth.js');

      const secret1 = 'my-secret-key-1';
      const secret2 = 'my-secret-key-2';

      const hash1 = hashApiKey(secret1);
      const hash2 = hashApiKey(secret2);

      expect(hash1).not.toBe(hash2);
    });

    it('should fall back to CLERK_SECRET_KEY if API_KEY_PEPPER is missing', async () => {
      vi.stubEnv('CLERK_SECRET_KEY', 'clerk-pepper');
      // Ensure API_KEY_PEPPER is not set
      vi.stubEnv('API_KEY_PEPPER', '');

      const { hashApiKey } = await import('../api-key-auth.js');

      const secret = 'my-secret-key';
      const hash = hashApiKey(secret);

      expect(hash).toBeTypeOf('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for the same secret but different pepper', async () => {
      vi.stubEnv('API_KEY_PEPPER', 'pepper-1');
      const { hashApiKey: hashApiKey1 } = await import('../api-key-auth.js');
      const hash1 = hashApiKey1('my-secret-key');

      vi.resetModules();
      vi.stubEnv('API_KEY_PEPPER', 'pepper-2');
      const { hashApiKey: hashApiKey2 } = await import('../api-key-auth.js');
      const hash2 = hashApiKey2('my-secret-key');

      expect(hash1).not.toBe(hash2);
    });

    it('should throw an error if no pepper environment variables are set', async () => {
      vi.stubEnv('API_KEY_PEPPER', '');
      vi.stubEnv('CLERK_SECRET_KEY', '');

      const { hashApiKey } = await import('../api-key-auth.js');

      expect(() => hashApiKey('my-secret-key')).toThrow(
        'API_KEY_PEPPER or CLERK_SECRET_KEY environment variable is required.'
      );

      try {
        hashApiKey('my-secret-key');
      } catch (err: unknown) {
        expect((err as { statusCode?: number }).statusCode).toBe(503);
      }
    });
  });
});
