import { useEffect, useState } from "react";
import type React from "react";
import { createRoot } from "react-dom/client";
import {
  ClerkFailed,
  ClerkLoaded,
  ClerkLoading,
  ClerkProvider,
} from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import { I18nProvider, useI18n } from "@/i18n";
import { clerkAz } from "@/i18n/clerk-az";
import { envConfig } from "@/config/env";
import { initServiceWorker } from "@/lib/pwa/register";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import App from "./App.tsx";
import "./globals.css";

// Global GSAP ScrollTrigger Optimization
gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);
ScrollTrigger.config({
  limitCallbacks: true,
  autoRefreshEvents: "visibilitychange,DOMContentLoaded,load"
});

// Optional reporting must not block the app shell when its chunk is unavailable offline.
void import("@/lib/sentry")
  .then(({ initSentry }) => initSentry())
  .catch(() => { /* Offline or blocked reporting never prevents rendering. */ });
initServiceWorker();

const clerkOptions = {
  signInUrl: "/auth/sign-in",
  signUpUrl: "/auth/sign-up",
  afterSignOutUrl: "/",
};

const authLoadingScreen = (
  <div className="flex min-h-screen items-center justify-center bg-[#030303] text-white">
    <div
      className="h-7 w-7 animate-spin rounded-full border-2 border-orange-500/25 border-t-orange-400"
      role="status"
      aria-label="Loading authentication"
    />
  </div>
);
const ClerkWithLanguage = ({ children }: { children: React.ReactNode }) => {
  const { lang } = useI18n();
  // Clerk's Russian pack is loaded on demand so English/Azerbaijani visitors don't download it.
  const [ruPack, setRuPack] = useState<typeof clerkAz | undefined>();
  useEffect(() => {
    if (lang !== "ru" || ruPack) return;
    void import("@clerk/localizations").then((mod) => setRuPack(mod.ruRU)).catch(() => undefined);
  }, [lang, ruPack]);
  const localization = lang === "ru" ? ruPack : lang === "az" ? clerkAz : undefined;
  return (
    <ClerkProvider publishableKey={envConfig.clerkPublishableKey} localization={localization} {...clerkOptions}>
      {children}
    </ClerkProvider>
  );
};

createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <BrowserRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      {envConfig.hasClerkConfig ? (
        <ClerkWithLanguage>
          <ClerkLoading>
            {authLoadingScreen}
          </ClerkLoading>
          <ClerkFailed>
            {/* Keep public pages usable and let auth screens show their existing
                configuration warning while Clerk is temporarily unavailable. */}
            <App clerkUnavailable />
          </ClerkFailed>
          <ClerkLoaded>
            <App />
          </ClerkLoaded>
        </ClerkWithLanguage>
      ) : (
        <App />
      )}
    </BrowserRouter>
  </I18nProvider>,
);
