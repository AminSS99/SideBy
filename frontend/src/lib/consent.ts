export type AnalyticsConsent = "accepted" | "rejected";

export const COOKIE_POLICY_VERSION = "2026-07-14";

export interface ConsentRecord {
  version: 1;
  policyVersion: typeof COOKIE_POLICY_VERSION;
  analytics: AnalyticsConsent;
  source: "banner" | "settings";
  updatedAt: string;
}

const CONSENT_STORAGE_KEY = "sideby.cookie-consent";

function hasGlobalPrivacyControl(): boolean {
  return typeof navigator !== "undefined" &&
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

export function readConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;

  try {
    const value = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<ConsentRecord>;
    if (
      parsed.version !== 1 ||
      parsed.policyVersion !== COOKIE_POLICY_VERSION ||
      (parsed.analytics !== "accepted" && parsed.analytics !== "rejected") ||
      (parsed.source !== "banner" && parsed.source !== "settings") ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }
    return parsed as ConsentRecord;
  } catch {
    return null;
  }
}

export function saveConsent(
  analytics: AnalyticsConsent,
  source: ConsentRecord["source"],
): ConsentRecord {
  const record: ConsentRecord = {
    version: 1,
    policyVersion: COOKIE_POLICY_VERSION,
    analytics,
    source,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  return record;
}

export function allowsAnalytics(consent: ConsentRecord | null): boolean {
  return consent?.analytics === "accepted" && !hasGlobalPrivacyControl();
}

export function isGlobalPrivacyControlEnabled(): boolean {
  return hasGlobalPrivacyControl();
}
