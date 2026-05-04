/**
 * Redis connection helper using @upstash/redis.
 * Compatible with Upstash, Vercel KV, and any Redis-over-HTTP provider.
 */
import { Redis } from "@upstash/redis";
import { randomUUID } from "crypto";

let redisInstance: Redis | null = null;

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
  const redis = getRedis();
  if (!redis) return true; // No redis = no locking

  const token = randomUUID();
  const acquired = await redis.set(lockKey, token, { nx: true, ex: ttlSeconds });
  return acquired === "OK";
}

export async function redisReleaseLock(lockKey: string): Promise<void> {
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
