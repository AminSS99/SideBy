/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
  readonly VITE_ALLOW_CLERK_TEST_KEY_IN_PRODUCTION?: string;
  readonly NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_PEXELS_API_KEY?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}
