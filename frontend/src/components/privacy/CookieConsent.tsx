import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { allowsAnalytics, COOKIE_SETTINGS_EVENT, isGlobalPrivacyControlEnabled, readConsent, saveConsent, type AnalyticsConsent, type ConsentRecord } from "@/lib/consent";
import { disablePostHog, initPostHog } from "@/lib/posthog";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Cookie } from "lucide-react";

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
    const openSettings = () => setShowSettings(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, openSettings);
  }, []);

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
          className="fixed bottom-2 left-2 right-2 z-[100] mx-auto max-w-2xl rounded-xl border border-white/15 bg-[#0d0b0a]/95 p-3 shadow-[0_24px_80px_rgba(0,0,0,.7)] backdrop-blur-2xl sm:bottom-5 sm:p-5"
        >
          <div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-md bg-orange-400/10 text-orange-300 sm:h-8 sm:w-8 sm:rounded-lg"><Cookie className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></span><h2 className="text-sm font-semibold text-white sm:text-base">Your privacy choices</h2></div>
          <p className="mt-1.5 text-xs leading-5 text-white/60 sm:mt-2 sm:text-sm sm:leading-6">
            <span className="sm:hidden">Essential cookies for sign-in; optional analytics with your permission.</span>
            <span className="hidden sm:inline">SideBy uses essential cookies for sign-in and security. With your permission, we also use PostHog analytics to understand product usage. You can change this anytime.</span>
          </p>
          {gpcEnabled ? (
            <p className="mt-2 text-sm text-amber-300">
              Your browser’s Global Privacy Control is on, so analytics remain disabled.
            </p>
          ) : null}
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:mt-4 sm:flex sm:justify-end">
            <button type="button" onClick={() => save("rejected", "banner")} className="min-h-10 rounded-lg border border-white/20 px-3 text-xs font-medium text-white/80 hover:bg-white/10 sm:min-h-11 sm:rounded-xl sm:px-4 sm:text-sm">
              Essential only
            </button>
            <button type="button" onClick={() => save("accepted", "banner")} disabled={gpcEnabled} className="min-h-10 rounded-lg bg-orange-700 px-3 text-xs font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11 sm:rounded-xl sm:px-4 sm:text-sm">
              Allow analytics
            </button>
          </div>
          <div className="mt-2 flex items-center gap-4 text-[10px] sm:mt-3 sm:text-xs">
            <button type="button" onClick={() => setShowSettings(true)} className="text-white/50 underline underline-offset-2 hover:text-white">
              Manage settings
            </button>
            <Link to="/legal/cookies" className="text-white/40 underline underline-offset-2 hover:text-white">
              Cookie Policy
            </Link>
          </div>
        </section>
      ) : null}

      {showSettings ? (
        <div role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title" className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 p-4">
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
