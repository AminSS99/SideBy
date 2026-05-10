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

// ClerkProvider configuration:
// - signInUrl / signUpUrl: tells Clerk where the auth pages live
// - afterSignOutUrl: where to redirect after sign out
// Clerk automatically handles session persistence via secure cookies
// and refreshes tokens as needed in the background.
const clerkOptions = {
  signInUrl: "/auth/sign-in",
  signUpUrl: "/auth/sign-up",
  afterSignOutUrl: "/",
};

createRoot(document.getElementById("root")!).render(
  envConfig.hasClerkConfig ? (
    <ClerkProvider 
      publishableKey={envConfig.clerkPublishableKey}
      {...clerkOptions}
    >
      <App />
    </ClerkProvider>
  ) : (
    <App />
  ),
);
