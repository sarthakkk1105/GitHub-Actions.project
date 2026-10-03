import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 15000,
  },
});