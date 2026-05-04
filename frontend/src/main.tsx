import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { initSentry } from "@/lib/sentry";
import { initPostHog } from "@/lib/posthog";
import App from "./App.tsx";
import "./globals.css";

// Initialize observability before React boot
initSentry();
initPostHog();

const clerkPublishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")!).render(
  clerkPublishableKey ? (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <App />
    </ClerkProvider>
  ) : (
    <App />
  ),
);
