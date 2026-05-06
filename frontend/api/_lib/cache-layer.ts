/**
 * Phase 12: Performance Cache Layer
 *
 * In-memory LRU cache with TTL for comparison results.
 * Tracks cache hits in query_analytics for cost measurement.
 */

import crypto from "crypto";
import { logger } from "./log.js";

// ─── In-Memory Cache ─────────────────────────────────────────────────────────

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
  accessCount: number;
};

class ComparisonCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 50, defaultTTLSeconds = 60) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  private key(slug: string): string {
    return `comp:${slug}`;
  }

  get<T>(slug: string): T | null {
    const entry = this.store.get(this.key(slug));
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(this.key(slug));
      return null;
    }

    entry.accessCount++;
    return entry.data as T;
  }

  getWithMeta<T>(slug: string): { data: T; accessCount: number } | null {
    const entry = this.store.get(this.key(slug));
    if (!entry || Date.now() > entry.expiresAt) {
      if (entry) this.store.delete(this.key(slug));
      return null;
    }
    entry.accessCount++;
    return { data: entry.data as T, accessCount: entry.accessCount };
  }

  set<T>(slug: string, data: T, ttlMs?: number): void {
    // Evict oldest if full
    if (this.store.size >= this.maxSize) {
      const oldest = [...this.store.entries()]
        .sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0];
      if (oldest) this.store.delete(oldest[0]);
    }

    this.store.set(this.key(slug), {
      data,
      expiresAt: Date.now() + (ttlMs || this.defaultTTL),
      accessCount: 0,
    });
  }

  size(): number {
    return this.store.size;
  }

  stats(): { size: number; entries: Array<{ key: string; accessCount: number }> } {
    return {
      size: this.store.size,
      entries: [...this.store.entries()].map(([k, v]) => ({
        key: k,
        accessCount: v.accessCount,
      })),
    };
  }
}

// Singleton
const comparisonCache = new ComparisonCache(50, 60);

// ─── Cache Tracking in Database ──────────────────────────────────────────────

async function trackCacheHit(
  db: ReturnType<typeof import("../../src/db/index.js").createDbClient>,
  comparisonId: string,
  cacheType: "memory" | "db" | "reuse",
  costSaved: number,
) {
  try {
    const { queryAnalytics } = await import("../../src/db/schema.js");
    const { eq, sql } = await import("drizzle-orm");

    await db
      .update(queryAnalytics)
      .set({
        totalCost: sql`${queryAnalytics.totalCost} - ${String(costSaved)}`,
      })
      .where(eq(queryAnalytics.comparisonId, comparisonId));
  } catch (e) {
    logger.warn("Failed to track cache hit", {
      error: e instanceof Error ? e.message : String(e),
      comparisonId,
      cacheType,
    });
  }
}

// ─── Cache Stats for Dashboard ───────────────────────────────────────────────

async function getCacheStats(
  db: ReturnType<typeof import("../../src/db/index.js").createDbClient>,
) {
  const { queryAnalytics } = await import("../../src/db/schema.js");
  const { sql } = await import("drizzle-orm");

  const [totalComparisons] = await db
    .select({ count: sql<number>`count(*)::integer` })
    .from(queryAnalytics);

  const [reusedCount] = await db
    .select({ count: sql<number>`count(*)::integer` })
    .from(queryAnalytics)
    .where(sql`${queryAnalytics.reusedFromId} IS NOT NULL`);

  const [totalCost] = await db
    .select({ sum: sql<number>`sum(${queryAnalytics.totalCost})::float` })
    .from(queryAnalytics)
    .where(sql`${queryAnalytics.totalCost} IS NOT NULL`);

  return {
    memoryCacheSize: comparisonCache.size(),
    totalComparisons: totalComparisons?.count || 0,
    reusedComparisons: reusedCount?.count || 0,
    reuseRate: totalComparisons?.count
      ? Math.round((reusedCount?.count || 0) / totalComparisons.count * 100)
      : 0,
    totalSpend: totalCost?.sum ? Math.round(totalCost.sum * 10000) / 10000 : 0,
  };
}

// ─── Hash util for prompt versioning ─────────────────────────────────────────

export function hashPrompt(prompt: string): string {
  return crypto.createHash("sha256").update(prompt.slice(0, 500)).digest("hex").slice(0, 12);
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export {
  comparisonCache,
  trackCacheHit,
  getCacheStats,
};

export type { CacheEntry };
