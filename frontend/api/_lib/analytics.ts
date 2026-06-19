import { PostHog } from "posthog-node";
import { serverEnv as env } from "./env.js";

let posthog: PostHog | null = null;

function getPostHog(): PostHog | null {
  if (!env.posthogKey) return null;
  if (!posthog) {
    posthog = new PostHog(env.posthogKey, {
      host: env.posthogHost || "https://us.i.posthog.com",
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
}

export async function shutdownAnalytics() {
  if (posthog) {
    await posthog._shutdown();
    posthog = null;
  }
}
