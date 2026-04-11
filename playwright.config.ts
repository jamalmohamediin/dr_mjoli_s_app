import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8080";
const nodeBinary = `"${process.execPath}"`;
const devServerCommand = `${nodeBinary} ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 8080`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-headed",
      use: {
        ...devices["Desktop Chrome"],
        headless: false,
        launchOptions: {
          slowMo: 350,
        },
      },
    },
  ],
  webServer: {
    command: devServerCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
