import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { envConfig } from "@/config/env";

let browserClient: SupabaseClient | null = null;

if (envConfig.hasSupabaseConfig) {
  browserClient = createClient(
    envConfig.supabaseUrl,
    envConfig.supabasePublishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
}

export const supabase = browserClient;
