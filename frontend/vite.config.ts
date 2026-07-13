import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
    __DEV__: mode !== "production",
  },
  server: {
    host: "::",
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    allowedHosts: "all",
    proxy: process.env.VITE_API_BASE_URL
      ? undefined
      : {
          "/api": {
            target: "http://localhost:3000",
            changeOrigin: true,
          },
        },
  },
  plugins: [dyadComponentTagger(), react()],
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
