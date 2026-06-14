import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import { envConfig } from "@/config/env";
import { initSentry } from "@/lib/sentry";
import { initPostHog } from "@/lib/posthog";
import App from "./App.tsx";
import "./globals.css";

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
