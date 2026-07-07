import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";

const hasSentryUploadConfig =
  Boolean(process.env.SENTRY_AUTH_TOKEN) &&
  Boolean(process.env.SENTRY_ORG) &&
  Boolean(process.env.SENTRY_PROJECT);

export default defineConfig(({ mode }) => ({
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
    __SENTRY_RELEASE__: JSON.stringify(
      process.env.SENTRY_RELEASE ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.VITE_SENTRY_RELEASE ||
        "",
    ),
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
  plugins: [
    dyadComponentTagger(),
    react(),
    hasSentryUploadConfig &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: {
          name:
            process.env.SENTRY_RELEASE ||
            process.env.VERCEL_GIT_COMMIT_SHA ||
            process.env.VITE_SENTRY_RELEASE,
        },
        sourcemaps: {
          assets: "./dist/assets/**",
          filesToDeleteAfterUpload: ["./dist/assets/**/*.map"],
        },
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: hasSentryUploadConfig,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@clerk")) {
              return "vendor-react-core";
            }
            if (id.includes("recharts") || id.includes("react-smooth") || id.includes("d3")) {
              return "vendor-react-core";
            }
            if (id.includes("gsap")) {
              return "vendor-gsap";
            }
            if (id.includes("framer-motion")) {
              return "vendor-react-core";
            }
            if (id.includes("lucide-react")) {
              return "vendor-react-core";
            }
            if (id.includes("@radix-ui") || id.includes("class-variance-authority")) {
              return "vendor-react-core";
            }
            if (id.includes("@sentry")) {
              return "vendor-react-core";
            }
            if (id.includes("@tanstack")) {
              return "vendor-react-core";
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
