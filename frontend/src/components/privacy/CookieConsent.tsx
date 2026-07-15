import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { allowsAnalytics, isGlobalPrivacyControlEnabled, readConsent, saveConsent, type AnalyticsConsent, type ConsentRecord } from "@/lib/consent";
import { disablePostHog, initPostHog } from "@/lib/posthog";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

export default function CookieConsent() {
  const { user } = useAuth();
  const [consent, setConsent] = useState<ConsentRecord | null>(readConsent);
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const syncedConsent = useRef<string | null>(null);

  useEffect(() => {
    setAnalyticsEnabled(allowsAnalytics(consent));
  }, [consent]);

  useEffect(() => {
    if (allowsAnalytics(consent)) {
      initPostHog();
    } else {
      disablePostHog();
    }
  }, [consent]);

  useEffect(() => {
    if (!user || !consent) return;
    const auditKey = `${user.id}:${consent.updatedAt}:${isGlobalPrivacyControlEnabled()}`;
    if (syncedConsent.current === auditKey) return;
    syncedConsent.current = auditKey;

    void apiFetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analytics: allowsAnalytics(consent),
        policyVersion: consent.policyVersion,
        source: consent.source,
        globalPrivacyControl: isGlobalPrivacyControlEnabled(),
      }),
    }).catch(() => {
      // Keep the browser choice intact and allow a later preference update to retry the audit write.
      syncedConsent.current = null;
    });
  }, [consent, user]);

  const save = useCallback((analytics: AnalyticsConsent, source: ConsentRecord["source"]) => {
    const next = saveConsent(analytics, source);
    setConsent(next);
    setShowSettings(false);
  }, []);

  const showBanner = consent === null;
  const gpcEnabled = isGlobalPrivacyControlEnabled();

  return (
    <>
      {showBanner ? (
        <section
          aria-label="Cookie preferences"
          className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-2xl rounded-xl border border-white/15 bg-zinc-950 p-5 shadow-2xl shadow-black/50 sm:left-auto"
        >
          <h2 className="text-base font-semibold text-white">Your privacy choices</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            SideBy uses essential cookies for sign-in and security. With your permission, we also use PostHog analytics to understand product usage. You can change this anytime.
          </p>
          {gpcEnabled ? (
            <p className="mt-2 text-sm text-amber-300">
              Your browser’s Global Privacy Control is on, so analytics remain disabled.
            </p>
          ) : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setShowSettings(true)} className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
              Manage settings
            </button>
            <button type="button" onClick={() => save("rejected", "banner")} className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
              Reject analytics
            </button>
            <button type="button" onClick={() => save("accepted", "banner")} disabled={gpcEnabled} className="rounded-md bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">
              Accept analytics
            </button>
          </div>
          <Link to="/legal/cookies" className="mt-3 inline-block text-xs text-white/60 underline hover:text-white">
            Cookie Policy
          </Link>
        </section>
      ) : null}

      <button type="button" onClick={() => setShowSettings(true)} className="fixed bottom-3 left-3 z-[90] rounded-full border border-white/15 bg-zinc-950 px-3 py-2 text-xs font-medium text-white/80 shadow-lg hover:bg-zinc-900">
        Cookie settings
      </button>

      {showSettings ? (
        <div role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title" className="fixed inset-0 z-[110] flex items-end justify-center bg-black/65 p-4 sm:items-center">
          <section className="w-full max-w-lg rounded-xl border border-white/15 bg-zinc-950 p-6 shadow-2xl">
            <h2 id="cookie-settings-title" className="text-lg font-semibold text-white">Cookie settings</h2>
            <div className="mt-5 rounded-lg border border-white/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-white">Essential cookies</h3>
                  <p className="mt-1 text-sm text-white/65">Required for Clerk authentication, fraud prevention, and CSRF protection.</p>
                </div>
                <span className="text-sm text-white/60">Always on</span>
              </div>
            </div>
            <label className="mt-3 flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-white/10 p-4">
              <span>
                <span className="block text-sm font-medium text-white">Analytics</span>
                <span className="mt-1 block text-sm text-white/65">PostHog product analytics helps us improve SideBy. It is optional.</span>
              </span>
              <input type="checkbox" checked={analyticsEnabled} disabled={gpcEnabled} onChange={(event) => setAnalyticsEnabled(event.target.checked)} className="mt-1 h-4 w-4 accent-orange-500" />
            </label>
            {gpcEnabled ? <p className="mt-3 text-sm text-amber-300">Global Privacy Control is enabled, so analytics cannot be turned on in this browser.</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowSettings(false)} className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">Cancel</button>
              <button type="button" onClick={() => save(analyticsEnabled ? "accepted" : "rejected", "settings")} className="rounded-md bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">Save choices</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
