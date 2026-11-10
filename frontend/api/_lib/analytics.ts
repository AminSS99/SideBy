import { PostHog } from "posthog-node";
import { waitUntil } from "@vercel/functions";
import { serverEnv as env } from "./env.js";

let posthog: PostHog | null = null;

function getPostHog(): PostHog | null {
  if (!env.posthogKey) return null;
  if (!posthog) {
    posthog = new PostHog(env.posthogKey, {
      host: env.posthogHost || "https://us.i.posthog.com",
      // Serverless: send immediately instead of batching in a process that may freeze.
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthog;
}

export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  const client = getPostHog();
  if (!client) return;
  client.capture({
    distinctId,
    event,
    properties: properties ?? {},
  });
  try {
    // Keep the function alive just long enough to deliver the event.
    waitUntil(client.flush());
  } catch {
    // Outside the Vercel runtime (tests, scripts): nothing to wait on.
  }
}

export async function shutdownAnalytics() {
  if (posthog) {
    await posthog._shutdown();
    posthog = null;
  }
}
