import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Production code imports the real `virtual:pwa-register` module
      // statically; unit tests resolve this stub instead so the production
      // import never changes just to satisfy the test runner.
      "virtual:pwa-register": path.resolve(__dirname, "./src/lib/pwa/__mocks__/pwa-register.mock.ts"),
    },
  },
  test: {
    exclude: ["e2e/**", "node_modules/**"],
  },
});
