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

  describe('requireApiKey', () => {
    it('throws 401 when no API key is provided, without checking rate limit', async () => {
      vi.stubEnv('API_KEY_PEPPER', 'test-pepper');
      const checkRateLimit = vi.fn();
      vi.doMock('../rate-limit.js', () => ({ checkRateLimit }));

      const { requireApiKey } = await import('../api-key-auth.js');

      const req = { headers: {} } as never;
      await expect(requireApiKey(req)).rejects.toMatchObject({
        statusCode: 401,
        message: 'API key required.',
      });

      expect(checkRateLimit).not.toHaveBeenCalled();
    });

    it('returns key info and costs no rate-limit check on valid key', async () => {
      vi.stubEnv('API_KEY_PEPPER', 'test-pepper');
      const checkRateLimit = vi.fn();
      vi.doMock('../rate-limit.js', () => ({ checkRateLimit }));

      const mockRow = {
        id: 'key_123',
        userId: 'user_abc',
        organizationId: 'org_xyz',
        workspaceId: 'ws_789',
        scopes: ['comparisons:read'],
      };

      const mockUpdateWhere = vi.fn().mockResolvedValue([]);
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

      const mockSelectLimit = vi.fn().mockResolvedValue([mockRow]);
      const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
      const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

      vi.doMock('../../../src/db/index.js', () => ({
        createDbClient: () => ({
          select: mockSelect,
          update: mockUpdate,
        }),
      }));

      const { requireApiKey } = await import('../api-key-auth.js');

      const req = {
        headers: { authorization: 'Bearer sb_live_valid_key' },
      } as never;

      const result = await requireApiKey(req);
      expect(result).toEqual({
        apiKeyId: 'key_123',
        userId: 'user_abc',
        orgId: 'org_xyz',
        workspaceId: 'ws_789',
        scopes: ['comparisons:read'],
      });

      expect(checkRateLimit).not.toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('calls checkRateLimit on failed lookup and throws 401 when under limit', async () => {
      vi.stubEnv('API_KEY_PEPPER', 'test-pepper');
      const checkRateLimit = vi.fn().mockResolvedValue({
        allowed: true,
        limit: 30,
        remaining: 29,
        resetAt: Date.now() + 60000,
        window: '1m',
      });
      vi.doMock('../rate-limit.js', () => ({ checkRateLimit }));

      const mockSelectLimit = vi.fn().mockResolvedValue([]);
      const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
      const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

      vi.doMock('../../../src/db/index.js', () => ({
        createDbClient: () => ({
          select: mockSelect,
        }),
      }));

      const { requireApiKey } = await import('../api-key-auth.js');

      const req = {
        headers: {
          authorization: 'Bearer sb_live_invalid_key',
          'x-forwarded-for': '198.51.100.42',
        },
      } as never;

      await expect(requireApiKey(req)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid API key.',
      });

      expect(checkRateLimit).toHaveBeenCalledWith('ip', '198.51.100.42', 'failed-api-key', 30);
    });

    it('throws 429 with Retry-After when failed attempts exceed rate limit', async () => {
      vi.stubEnv('API_KEY_PEPPER', 'test-pepper');
      const resetAt = Date.now() + 45000;
      const checkRateLimit = vi.fn().mockResolvedValue({
        allowed: false,
        limit: 30,
        remaining: 0,
        resetAt,
        window: '1m',
      });
      vi.doMock('../rate-limit.js', () => ({ checkRateLimit }));

      const mockSelectLimit = vi.fn().mockResolvedValue([]);
      const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
      const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

      vi.doMock('../../../src/db/index.js', () => ({
        createDbClient: () => ({
          select: mockSelect,
        }),
      }));

      const { requireApiKey } = await import('../api-key-auth.js');

      const headers: Record<string, string> = {};
      const res = {
        setHeader: vi.fn((k: string, v: string) => { headers[k] = v; }),
      };

      const req = {
        headers: {
          authorization: 'Bearer sb_live_invalid_key',
          'x-forwarded-for': '198.51.100.42',
        },
      } as never;

      await expect(requireApiKey(req, res as never)).rejects.toMatchObject({
        statusCode: 429,
        code: 'RATE_LIMITED',
        message: 'Too many invalid API key attempts. Please slow down.',
      });

      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
      expect(Number(headers['Retry-After'])).toBeGreaterThan(0);
    });
  });
});
