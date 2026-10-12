import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { sideByManifest } from "./src/lib/pwa/manifest";

export default defineConfig(({ mode }) => ({
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
    __DEV__: mode !== "production",
  },
  server: {
    host: "::",
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    allowedHosts: true,
    proxy: process.env.VITE_API_BASE_URL
      ? undefined
      : {
          "/api": {
            target: "http://localhost:3000",
            changeOrigin: true,
          },
        },
  },
  plugins: [
    dyadComponentTagger(),
    react(),
    VitePWA({
      // injectManifest: our own typed service worker (src/sw.ts) so push and
      // notification-click handling live next to production-safe caching.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "prompt",
      injectRegister: false,
      manifest: sideByManifest,
      injectManifest: {
        // Precache the app shell with revision hashes; workbox versions the
        // precache automatically so deploys invalidate cleanly.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        globIgnores: [
          "**/snapsolve*.png",
          "**/placeholder.svg",
          "**/sw.js",
          "**/vendor-observability-*.js",
          "**/vendor-charts-*.js",
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@clerk")) return "vendor-auth";
          if (id.includes("gsap") || id.includes("framer-motion")) return "vendor-animation";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("@sentry")) return "vendor-observability";
          if (id.includes("@tanstack")) return "vendor-data";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("posthog-js")) return "vendor-analytics";
          if (
            id.includes("@radix-ui") ||
            id.includes("vaul") ||
            id.includes("cmdk") ||
            id.includes("embla-carousel-react") ||
            id.includes("class-variance-authority")
          ) {
            return "vendor-ui";
          }
          return undefined;
        },
        onlyExplicitManualChunks: true,
      },
    },
  },
}));
