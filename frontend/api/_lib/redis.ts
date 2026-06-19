/**
 * Redis connection helper using @upstash/redis.
 * Compatible with Upstash, Vercel KV, and any Redis-over-HTTP provider.
 */
import { Redis } from "@upstash/redis";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";

let redisInstance: Redis | null = null;
let pgSql: ReturnType<typeof neon> | null = null;
let pgStoreReady: Promise<void> | null = null;
let redisWarned = false;

export type RedisLock = {
  key: string;
  token: string;
};

const isProductionRuntime = () =>
  process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

const allowDevRedisFallback = () =>
  !isProductionRuntime() && process.env.DEV_ALLOW_REDIS_FALLBACK === "true";

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ""
  );
}

function getPgSql() {
  if (pgSql) return pgSql;
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return null;
  pgSql = neon(databaseUrl);
  return pgSql;
}

async function ensurePgStore() {
  const sql = getPgSql();
  if (!sql) return false;

  pgStoreReady ??= sql`
    create table if not exists sideby_runtime_kv (
      key text primary key,
      value jsonb not null,
      expires_at timestamptz,
      updated_at timestamptz not null default now()
    )
  `.then(() => undefined);

  await pgStoreReady;
  return true;
}

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

export function isRuntimeStoreConfigured(): boolean {
  return isRedisConfigured() || Boolean(getDatabaseUrl());
}

export function getRuntimeStoreKind(): "redis" | "postgres" | "none" {
  if (isRedisConfigured()) return "redis";
  return getDatabaseUrl() ? "postgres" : "none";
}

export async function assertRedisAvailable(): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    if (allowDevRedisFallback()) return;
    if (await ensurePgStore()) return;
    throw Object.assign(new Error("Redis or DATABASE_URL is required for locks and rate limits."), {
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
  if (!redis) {
    if (!(await ensurePgStore())) return null;
    const sql = getPgSql();
    if (!sql) return null;
    const rows = await sql`
      select value
      from sideby_runtime_kv
      where key = ${key}
        and (expires_at is null or expires_at > now())
      limit 1
    ` as Array<{ value: T }>;
    return (rows[0]?.value as T | undefined) ?? null;
  }
  const value = await redis.get<T>(key);
  return value ?? null;
}

export async function redisSet<T>(
  key: string,
  value: T,
  ttlSeconds = 3600,
): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    if (!(await ensurePgStore())) return;
    const sql = getPgSql();
    if (!sql) return;
    await sql`
      insert into sideby_runtime_kv (key, value, expires_at, updated_at)
      values (${key}, ${JSON.stringify(value)}::jsonb, now() + (${ttlSeconds} * interval '1 second'), now())
      on conflict (key)
      do update set value = excluded.value, expires_at = excluded.expires_at, updated_at = now()
    `;
    return;
  }
  await redis.set(key, value, { ex: ttlSeconds });
}

export async function redisDel(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    if (!(await ensurePgStore())) return;
    const sql = getPgSql();
    if (!sql) return;
    await sql`delete from sideby_runtime_kv where key = ${key}`;
    return;
  }
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
    if (!(await ensurePgStore())) return null;
    const sql = getPgSql();
    if (!sql) return null;
    const token = randomUUID();
    const rows = await sql`
      insert into sideby_runtime_kv (key, value, expires_at, updated_at)
      values (${lockKey}, ${JSON.stringify({ token })}::jsonb, now() + (${ttlSeconds} * interval '1 second'), now())
      on conflict (key)
      do update set value = excluded.value, expires_at = excluded.expires_at, updated_at = now()
      where sideby_runtime_kv.expires_at is null or sideby_runtime_kv.expires_at <= now()
      returning key
    ` as Array<{ key: string }>;
    return rows.length > 0 ? { key: lockKey, token } : null;
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

  if (typeof lock === "string") {
    if (allowDevRedisFallback()) return;
    throw new Error("Redis lock release requires a lock token.");
  }

  if (!redis) {
    if (!(await ensurePgStore())) return;
    const sql = getPgSql();
    if (!sql) return;
    await sql`
      delete from sideby_runtime_kv
      where key = ${lock.key}
        and value->>'token' = ${lock.token}
    `;
    return;
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
  if (!redis) {
    await redisDel(lockKey);
    return;
  }
  await redis.del(lockKey);
}

export async function redisIncrement(
  key: string,
  amount = 1,
  ttlSeconds?: number,
): Promise<number> {
  const redis = getRedis();
  if (!redis) {
    if (!(await ensurePgStore())) return 0;
    const sql = getPgSql();
    if (!sql) return 0;
    await sql`
      delete from sideby_runtime_kv
      where key = ${key}
        and expires_at is not null
        and expires_at <= now()
    `;

    const rows = ttlSeconds
      ? await sql`
          insert into sideby_runtime_kv (key, value, expires_at, updated_at)
          values (${key}, ${JSON.stringify(amount)}::jsonb, now() + (${ttlSeconds} * interval '1 second'), now())
          on conflict (key)
          do update set
            value = to_jsonb(coalesce((sideby_runtime_kv.value #>> '{}')::integer, 0) + ${amount}),
            updated_at = now()
          returning (value #>> '{}')::integer as value
        `
      : await sql`
      insert into sideby_runtime_kv (key, value, expires_at, updated_at)
      values (${key}, ${JSON.stringify(amount)}::jsonb, null, now())
      on conflict (key)
      do update set
        value = to_jsonb(coalesce((sideby_runtime_kv.value #>> '{}')::integer, 0) + ${amount}),
        updated_at = now()
      returning (value #>> '{}')::integer as value
    `;
    const typedRows = rows as Array<{ value: number | string }>;
    return Number(typedRows[0]?.value ?? amount);
  }
  const value = await redis.incrby(key, amount);
  if (ttlSeconds) {
    await redis.expire(key, ttlSeconds);
  }
  return value;
}
