import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { allowsAnalytics, COOKIE_SETTINGS_EVENT, isGlobalPrivacyControlEnabled, readConsent, saveConsent, type AnalyticsConsent, type ConsentRecord } from "@/lib/consent";
import { disablePostHog, initPostHog } from "@/lib/posthog";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Cookie } from "@/components/icons";
import * as Dialog from "@radix-ui/react-dialog";
import { useT } from "@/i18n";

export default function CookieConsent() {
  const t = useT();
  const { user } = useAuth();
  const userId = user?.id;
  const [consent, setConsent] = useState<ConsentRecord | null>(readConsent);
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const syncedConsent = useRef<string | null>(null);
  const settingsOpener = useRef<HTMLElement | null>(null);

  const openSettings = useCallback(() => {
    settingsOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setAnalyticsEnabled(allowsAnalytics(consent));
    setShowSettings(true);
  }, [consent]);

  useEffect(() => {
    setAnalyticsEnabled(allowsAnalytics(consent));
  }, [consent]);

  useEffect(() => {
    window.addEventListener(COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, openSettings);
  }, [openSettings]);

  useEffect(() => {
    if (allowsAnalytics(consent)) {
      initPostHog();
    } else {
      disablePostHog();
    }
  }, [consent]);

  useEffect(() => {
    if (!userId || !consent) return;
    const auditKey = `${userId}:${consent.updatedAt}:${isGlobalPrivacyControlEnabled()}`;
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
    }, { retries: 0 }).catch(() => {
      // Consent auditing is best-effort and must never create a retry/render
      // loop. A later preference change gets a new audit key and tries again.
    });
  }, [consent, userId]);

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
          aria-label={t("cookie.aria")}
          className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0d0b0a]/96 p-2.5 shadow-[0_18px_50px_rgba(0,0,0,.65)] backdrop-blur-xl sm:p-4"
        >
          <p className="text-[11px] leading-4 text-white/80 sm:text-xs sm:leading-5">
            <Cookie aria-hidden="true" className="mr-1.5 -mt-0.5 inline h-3.5 w-3.5 text-orange-300" />
            {t("cookie.text")}{" "}
            <Link to="/legal/cookies" className="text-white/80 underline underline-offset-2 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">{t("cookie.more")}</Link>
          </p>
          {gpcEnabled ? (
            <p className="mt-1 text-xs text-amber-300">{t("cookie.gpcBanner")}</p>
          ) : null}
          <div className="mt-1.5 flex items-center gap-1.5 sm:mt-2 sm:gap-2">
            <button type="button" onClick={() => save("accepted", "banner")} disabled={gpcEnabled} className="min-h-9 flex-1 rounded-xl bg-white px-2.5 text-xs font-semibold text-[#130d09] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11 sm:px-3">
              {t("cookie.accept")}
            </button>
            <button type="button" onClick={() => save("rejected", "banner")} className="min-h-9 flex-1 rounded-xl border border-white/20 px-2.5 text-xs font-medium text-white/85 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-[0.99] sm:min-h-11 sm:px-3">
              {t("cookie.essential")}
            </button>
            <button type="button" onClick={openSettings} className="min-h-9 rounded-xl px-2 text-xs text-white/80 underline underline-offset-2 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:min-h-11 sm:px-2.5">
              {t("cookie.settings")}
            </button>
          </div>
        </section>
      ) : null}

      <Dialog.Root open={showSettings} onOpenChange={setShowSettings}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:animate-none" />
          <Dialog.Content
            onCloseAutoFocus={(event) => {
              if (settingsOpener.current?.isConnected) {
                event.preventDefault();
                settingsOpener.current.focus();
              }
            }}
            className="fixed left-1/2 top-1/2 z-[120] max-h-[calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950 p-5 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:animate-none sm:p-6"
          >
            <Dialog.Title className="text-lg font-semibold text-white">{t("cookie.title")}</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-relaxed text-white/65">
              {t("cookie.desc")}
            </Dialog.Description>
            <div className="mt-5 rounded-lg border border-white/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-white">{t("cookie.essentialTitle")}</h3>
                  <p className="mt-1 text-sm text-white/65">{t("cookie.essentialBody")}</p>
                </div>
                <span className="text-sm text-white/60">{t("cookie.alwaysOn")}</span>
              </div>
            </div>
            <label className="mt-3 flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-white/10 p-4">
              <span>
                <span className="block text-sm font-medium text-white">{t("cookie.analytics")}</span>
                <span className="mt-1 block text-sm text-white/65">{t("cookie.analyticsBody")}</span>
              </span>
              <input type="checkbox" checked={analyticsEnabled} disabled={gpcEnabled} onChange={(event) => setAnalyticsEnabled(event.target.checked)} className="mt-1 h-4 w-4 accent-orange-500" />
            </label>
            {gpcEnabled ? <p className="mt-3 text-sm text-amber-300">{t("cookie.gpcDialog")}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close asChild>
                <button type="button" className="min-h-11 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">{t("cookie.cancel")}</button>
              </Dialog.Close>
              <button type="button" onClick={() => save(analyticsEnabled ? "accepted" : "rejected", "settings")} className="min-h-11 rounded-xl bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">{t("cookie.save")}</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
