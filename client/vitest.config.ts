import { defineConfig } from "vitest/config";

// Only pure logic is tested here (no DOM), so the plain node environment is enough.
export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
