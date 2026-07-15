export type DiscoverySource =
  | "search"
  | "social"
  | "friend"
  | "community"
  | "product_directory"
  | "snap_ecosystem"
  | "other";

export type OnboardingAttribution = {
  source: DiscoverySource;
  detail: string | null;
  capturedAt: string;
};

const ATTRIBUTION_KEY_PREFIX = "sideby.onboarding.discovery.v1";

const getStorageKey = (userId: string) => `${ATTRIBUTION_KEY_PREFIX}:${userId}`;

export function readOnboardingAttribution(userId: string | null | undefined): OnboardingAttribution | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnboardingAttribution>;
    if (!parsed.source || !parsed.capturedAt) return null;
    return {
      source: parsed.source,
      detail: typeof parsed.detail === "string" ? parsed.detail : null,
      capturedAt: parsed.capturedAt,
    };
  } catch {
    return null;
  }
}

export function saveOnboardingAttribution(userId: string, attribution: OnboardingAttribution) {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(attribution));
  } catch {
    // Analytics still captures the selection when local storage is unavailable.
  }
}

export function markFirstComparisonStarted(userId: string, comparisonId: string) {
  try {
    sessionStorage.setItem(`sideby.first-comparison.v1:${userId}`, comparisonId);
  } catch {
    // Session storage is an enhancement; the comparison itself still runs.
  }
}

export function isFirstComparison(userId: string | null | undefined, comparisonId: string | undefined) {
  if (!userId || !comparisonId) return false;
  try {
    return sessionStorage.getItem(`sideby.first-comparison.v1:${userId}`) === comparisonId;
  } catch {
    return false;
  }
}

export function completeFirstComparison(userId: string | null | undefined) {
  if (!userId) return;
  try {
    sessionStorage.removeItem(`sideby.first-comparison.v1:${userId}`);
  } catch {
    // Ignore unavailable storage.
  }
}
