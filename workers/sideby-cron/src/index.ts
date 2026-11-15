/**
 * SideBy Cloudflare Cron Worker
 *
 * Bridges Vercel Hobby's once-per-day cron limitation by triggering:
 *  - Every 2 minutes (`*\/2 * * * *`): POST /api/jobs/drain (reclaims orphaned jobs & drains queued comparisons)
 *  - Every hour (`0 * * * *`): POST /api/watchlists-run (executes due watchlist refreshes)
 *
 * Required secret:
 *   wrangler secret put CRON_SECRET
 */

export interface Env {
  SIDEBY_BASE_URL?: string;
  CRON_SECRET?: string;
}

interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function invokeSideByCronEndpoint(
  env: Env,
  path: "/api/jobs/drain" | "/api/watchlists-run",
): Promise<{ path: string; status: number; ok: boolean; body: unknown; durationMs: number }> {
  const baseUrl = (env.SIDEBY_BASE_URL || "https://sideby.ink").replace(/\/+$/, "");
  const secret = env.CRON_SECRET?.trim();
  if (!secret) {
    throw new Error("CRON_SECRET is not configured on sideby-cron-worker.");
  }

  const start = Date.now();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      "User-Agent": "sideby-cloudflare-cron/1.0",
    },
  });

  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // keep raw text
  }

  return {
    path,
    status: response.status,
    ok: response.ok,
    body: parsed,
    durationMs: Date.now() - start,
  };
}

export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const tasks: Array<Promise<unknown>> = [
      invokeSideByCronEndpoint(env, "/api/jobs/drain").then((res) => {
        console.log(JSON.stringify({ event: "cron.drain", cron: controller.cron, ...res }));
      }),
    ];

    if (controller.cron === "0 * * * *") {
      tasks.push(
        invokeSideByCronEndpoint(env, "/api/watchlists-run").then((res) => {
          console.log(JSON.stringify({ event: "cron.watchlists", cron: controller.cron, ...res }));
        }),
      );
    }

    ctx.waitUntil(
      Promise.allSettled(tasks).then((outcomes) => {
        for (const outcome of outcomes) {
          if (outcome.status === "rejected") {
            console.error(
              JSON.stringify({
                event: "cron.error",
                cron: controller.cron,
                error: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason),
              }),
            );
          }
        }
      }),
    );
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health" && request.method === "GET") {
      return Response.json({
        ok: true,
        worker: "sideby-cron-worker",
        target: env.SIDEBY_BASE_URL || "https://sideby.ink",
        secretConfigured: Boolean(env.CRON_SECRET?.trim()),
      });
    }

    if (url.pathname === "/trigger" && request.method === "POST") {
      const secret = env.CRON_SECRET?.trim();
      const authHeader = request.headers.get("authorization") || "";
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();

      if (!secret || !constantTimeEquals(token, secret)) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }

      const targetPath =
        url.searchParams.get("job") === "watchlists"
          ? "/api/watchlists-run"
          : "/api/jobs/drain";

      const result = await invokeSideByCronEndpoint(env, targetPath);
      return Response.json(result, { status: result.ok ? 200 : 502 });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
