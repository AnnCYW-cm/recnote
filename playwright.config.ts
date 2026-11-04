import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const localChrome =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const localChannel =
  !process.env.CI && process.platform === 'darwin' && existsSync(localChrome)
    ? 'chrome'
    : undefined;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: localChannel,
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
