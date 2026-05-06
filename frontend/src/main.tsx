import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { envConfig } from "@/config/env";
import { initSentry } from "@/lib/sentry";
import { initPostHog } from "@/lib/posthog";
import App from "./App.tsx";
import "./globals.css";

// Initialize observability before React boot
initSentry();
initPostHog();

createRoot(document.getElementById("root")!).render(
  envConfig.hasClerkConfig ? (
    <ClerkProvider publishableKey={envConfig.clerkPublishableKey}>
      <App />
    </ClerkProvider>
  ) : (
    <App />
  ),
);
