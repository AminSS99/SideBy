import { createRoot } from "react-dom/client";
import {
  ClerkFailed,
  ClerkLoaded,
  ClerkLoading,
  ClerkProvider,
} from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import { envConfig } from "@/config/env";
import { initSentry } from "@/lib/sentry";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import App from "./App.tsx";
import "./globals.css";

// Global GSAP ScrollTrigger Optimization
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({
  limitCallbacks: true,
  autoRefreshEvents: "visibilitychange,DOMContentLoaded,load"
});

initSentry();

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

createRoot(document.getElementById("root")!).render(
  <BrowserRouter
    future={{
      v7_relativeSplatPath: true,
      v7_startTransition: true,
    }}
  >
    {envConfig.hasClerkConfig ? (
      <ClerkProvider
        publishableKey={envConfig.clerkPublishableKey}
        {...clerkOptions}
      >
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
      </ClerkProvider>
    ) : (
      <App />
    )}
  </BrowserRouter>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((reg) => console.log("Service Worker registered on scope:", reg.scope))
      .catch((err) => console.error("Service Worker registration failed:", err));
  });
}
