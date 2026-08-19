/**
 * Typed server-side logging helper for SideBy API functions.
 * Safe to use in Vercel Functions. Never logs secrets or raw prompts.
 */

import { Logtail } from "@logtail/node";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  comparisonId?: string;
  jobId?: string;
  userId?: string | null;
  provider?: string;
  model?: string;
  [key: string]: unknown;
}

const isDev = process.env.NODE_ENV !== "production";
const betterStackSourceToken = process.env.BETTER_STACK_SOURCE_TOKEN?.trim();
const betterStackIngestingHost = process.env.BETTER_STACK_INGESTING_HOST?.trim();
const betterStack = betterStackSourceToken && betterStackIngestingHost
  ? new Logtail(betterStackSourceToken, {
      endpoint: `https://${betterStackIngestingHost.replace(/^https?:\/\//, "")}`,
      batchSize: 1,
      ignoreExceptions: true,
      retryCount: 1,
      timeout: 1500,
    })
  : null;
const pendingBetterStackLogs = new Set<Promise<unknown>>();

function sanitize(value: unknown): unknown {
  if (typeof value === "string") {
    // Redact common secret patterns
    return value
      .replace(/sk-[a-zA-Z0-9]{20,}/g, "[REDACTED_KEY]")
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/g, "Bearer [REDACTED]")
      .replace(/api[_-]?key[=:]\s*[a-zA-Z0-9._-]+/gi, "api_key=[REDACTED]");
  }
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const lower = k.toLowerCase();
      if (
        lower.includes("secret") ||
        lower.includes("password") ||
        lower.includes("token") ||
        lower.includes("key") ||
        lower.includes("authorization") ||
        lower.includes("cookie") ||
        lower.includes("prompt")
      ) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = sanitize(v);
      }
    }
    return out;
  }
  return value;
}

function log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
  const payload: Record<string, unknown> = {
    level,
    message,
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || "unknown",
    vercel: process.env.VERCEL === "1",
  };

  if (context) {
    payload.context = sanitize(context);
  }

  if (error) {
    payload.error = {
      name: error.name,
      message: error.message,
      stack: isDev ? error.stack : undefined,
    };
  }

  const pendingLog = betterStack?.[level](message, payload);
  if (pendingLog) {
    pendingBetterStackLogs.add(pendingLog);
    void pendingLog
      .catch(() => undefined)
      .finally(() => pendingBetterStackLogs.delete(pendingLog));
  }

  // In production, log as JSON for ingest pipelines
  if (process.env.VERCEL === "1") {
    console.log(JSON.stringify(payload));
    return;
  }

  // In development, pretty print
  const ctx = context ? ` | ${JSON.stringify(sanitize(context))}` : "";
  if (level === "error") {
    console.error(`[${level.toUpperCase()}] ${message}${ctx}`, error ?? "");
  } else if (level === "warn") {
    console.warn(`[${level.toUpperCase()}] ${message}${ctx}`);
  } else {
    console.log(`[${level.toUpperCase()}] ${message}${ctx}`);
  }
}

export async function flushBetterStackLogs() {
  await Promise.allSettled([...pendingBetterStackLogs]);
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (isDev) log("debug", message, context);
  },
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, error?: Error, context?: LogContext) =>
    log("error", message, context, error),
};
