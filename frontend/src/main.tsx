import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import { envConfig } from "@/config/env";
import { initSentry } from "@/lib/sentry";
import { initPostHog } from "@/lib/posthog";
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
initPostHog();

const clerkOptions = {
  signInUrl: "/auth/sign-in",
  signUpUrl: "/auth/sign-up",
  afterSignOutUrl: "/",
};

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
        <App />
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
