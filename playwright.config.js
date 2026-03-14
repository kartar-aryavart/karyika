// 🎭 Playwright Config — Karyika E2E Tests
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.test.js",
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Retry on CI
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  // Reporter
  reporter: [
    ["html", { outputFolder: "tests/report", open: "never" }],
    ["list"],
    ["json", { outputFile: "tests/results.json" }],
  ],

  use: {
    // App URL
    baseURL: process.env.TEST_URL || "http://localhost:5173",
    
    // Record traces on failure
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    
    // Viewport
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    // Desktop Chrome (primary)
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Mobile (PWA testing)
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  // Start dev server before tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
