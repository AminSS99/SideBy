/** Bounded, read-only API smoke. This does not certify generation capacity. */
import { performance } from "node:perf_hooks";

const base = process.env.LOAD_BASE_URL;
if (!base) throw new Error("Set LOAD_BASE_URL to the deployment to test.");
const origin = new URL(base);
if (!["https:", "http:"].includes(origin.protocol) || origin.username || origin.password) {
  throw new Error("LOAD_BASE_URL must be an HTTP(S) origin without credentials.");
}
const count = Number(process.env.LOAD_REQUESTS ?? 30);
const concurrency = Number(process.env.LOAD_CONCURRENCY ?? 3);
if (!Number.isInteger(count) || count < 1 || count > 10000 ||
    !Number.isInteger(concurrency) || concurrency < 1 || concurrency > 100) {
  throw new Error("Use 1–10000 requests and 1–100 concurrent workers.");
}
const paths = ["/api/health", "/api/comparisons/taxonomy"];
const results = [];
let cursor = 0;
const started = performance.now();
await Promise.all(Array.from({ length: Math.min(concurrency, count) }, async () => {
  while (cursor < count) {
    const index = cursor++;
    const path = paths[index % paths.length];
    const before = performance.now();
    try {
      const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(15000), redirect: "error" });
      const body = await response.json();
      const valid = path === "/api/health" ? body.status === "ok" : Array.isArray(body.categories) && body.categories.length > 0;
      results.push({ path, status: response.status, ok: response.ok && valid, ms: performance.now() - before });
    } catch {
      results.push({ path, status: 0, ok: false, ms: performance.now() - before });
    }
  }
}));
const metrics = paths.map((path) => {
  const rows = results.filter((result) => result.path === path);
  const times = rows.map((result) => result.ms).sort((a, b) => a - b);
  return { path, requests: rows.length, failures: rows.filter((result) => !result.ok).length,
    p95Ms: times.length ? Math.round(times[Math.ceil(times.length * 0.95) - 1]) : null,
    statuses: [...new Set(rows.map((result) => result.status))] };
});
console.log(JSON.stringify({ origin: origin.origin, concurrency, elapsedMs: Math.round(performance.now() - started), metrics }, null, 2));
if (results.some((result) => !result.ok)) process.exitCode = 1;
