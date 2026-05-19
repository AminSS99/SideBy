import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    __DEV__: "false",
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
          if (id.includes("node_modules")) {
            if (id.includes("@clerk")) {
              return "vendor-clerk";
            }
            if (id.includes("recharts") || id.includes("d3")) {
              return "vendor-charts";
            }
            if (id.includes("gsap")) {
              return "vendor-gsap";
            }
            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("@radix-ui")) {
              return "vendor-radix";
            }
            if (id.includes("@sentry")) {
              return "vendor-sentry";
            }
            if (id.includes("@tanstack")) {
              return "vendor-tanstack";
            }
            if (id.includes("react") || id.includes("scheduler")) {
              return "vendor-react-core";
            }
            return "vendor";
          }
        },
      },
    },
  },
}));
