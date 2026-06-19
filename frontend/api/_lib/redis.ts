/**
 * Redis connection helper using @upstash/redis.
 * Compatible with Upstash, Vercel KV, and any Redis-over-HTTP provider.
 */
import { Redis } from "@upstash/redis";
import { randomUUID } from "crypto";

let redisInstance: Redis | null = null;
let redisWarned = false;

export type RedisLock = {
  key: string;
  token: string;
};

const isProductionRuntime = () =>
  process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

const allowDevRedisFallback = () =>
  !isProductionRuntime() && process.env.DEV_ALLOW_REDIS_FALLBACK === "true";

export function getRedis(): Redis | null {
  if (redisInstance) return redisInstance;

  const url = process.env.REDIS_URL || process.env.KV_URL;
  const token = process.env.REDIS_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  redisInstance = new Redis({ url, token });
  return redisInstance;
}

export function isRedisConfigured(): boolean {
  return getRedis() !== null;
}

export async function assertRedisAvailable(): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    if (allowDevRedisFallback()) return;
    throw Object.assign(new Error("Redis is required for locks and rate limits."), {
      statusCode: 503,
    });
  }

  try {
    await redis.set("__sideby:redis-health", "1", { ex: 30 });
  } catch {
    throw Object.assign(new Error("Redis is unavailable. Please try again shortly."), {
      statusCode: 503,
    });
  }
}

export async function redisGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  const value = await redis.get<T>(key);
  return value ?? null;
}

export async function redisSet<T>(
  key: string,
  value: T,
  ttlSeconds = 3600,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(key, value, { ex: ttlSeconds });
}

export async function redisDel(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(key);
}

export async function redisAcquireLock(
  lockKey: string,
  ttlSeconds = 30,
): Promise<boolean> {
  return (await redisAcquireLockToken(lockKey, ttlSeconds)) !== null;
}

export async function redisAcquireLockToken(
  lockKey: string,
  ttlSeconds = 30,
): Promise<RedisLock | null> {
  const redis = getRedis();
  if (!redis) {
    if (allowDevRedisFallback()) {
      if (!redisWarned) {
        redisWarned = true;
        console.warn("Redis lock fallback enabled for local development.");
      }
      return { key: lockKey, token: `dev:${randomUUID()}` };
    }
    return null;
  }

  const token = randomUUID();
  try {
    const acquired = await redis.set(lockKey, token, { nx: true, ex: ttlSeconds });
    return acquired === "OK" ? { key: lockKey, token } : null;
  } catch {
    return null;
  }
}

export async function redisReleaseLock(lock: RedisLock | string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  if (typeof lock === "string") {
    if (allowDevRedisFallback()) return;
    throw new Error("Redis lock release requires a lock token.");
  }

  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  await redis.eval(script, [lock.key], [lock.token]);
}

export async function redisForceReleaseLock(lockKey: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(lockKey);
}

export async function redisIncrement(
  key: string,
  amount = 1,
  ttlSeconds?: number,
): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  const value = await redis.incrby(key, amount);
  if (ttlSeconds) {
    await redis.expire(key, ttlSeconds);
  }
  return value;
}
