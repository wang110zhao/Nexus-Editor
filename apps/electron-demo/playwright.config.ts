import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Electron launches a real desktop app; parallel workers fight over the
  // single-instance lock and the shared vault fixture directory.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
