import { afterEach, expect, it, vi } from "vitest";
import { redisIncrement } from "../redis.js";

afterEach(() => vi.unstubAllEnvs());

it("fails closed when no shared counter store is configured", async () => {
  for (const key of ["REDIS_URL", "KV_URL", "REDIS_TOKEN", "KV_REST_API_TOKEN", "DATABASE_URL_UNPOOLED", "DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL"]) vi.stubEnv(key, undefined);
  await expect(redisIncrement("rate:test", 1, 60)).rejects.toMatchObject({ statusCode: 503 });
});
