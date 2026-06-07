import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load E2E environment variables before Playwright initializes
dotenv.config({ path: path.join(__dirname, '.env.e2e'), override: true });

/**
 * Playwright E2E Configuration â€” Level 3 Tests
 *
 * Architecture:
 *   Playwright (Chromium) -> Next.js :3600 -> NestJS :3902 -> nexus_e2e_db
 *
 * Prerequisites:
 *   - PostgreSQL running with nexus_e2e_db created
 *   - NestJS backend running at http://localhost:3902 against nexus_e2e_db
 *   - See backend/docs/E2E_TESTS_LEVEL3_PLAN.md for full setup guide
 */
export default defineConfig({
  testDir: './e2e',

  /* Run spec files sequentially â€” they share the same database */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Single worker to avoid race conditions on shared DB */
  workers: 1,

  /* Timeout per test */
  timeout: 30_000,

  /* Reporter */
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'on-failure' }]],

  use: {
    /* Base URL for page.goto('/catalog') shorthand */
    baseURL: 'http://127.0.0.1:3600',

    /* Collect trace on first retry â€” helps debug CI failures */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Viewport */
    viewport: { width: 1280, height: 720 },
  },

  /* Test only with Chromium for speed */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Output folder for screenshots/traces */
  outputDir: 'playwright-output',

  /**
   * Playwright owns the full local stack for smoke/e2e runs:
   *   Chromium -> Next.js :3600 -> NestJS :3902 -> nexus_e2e_db
   */
  webServer: [
    {
      command: 'npm --prefix backend run start:e2e',
      url: 'http://127.0.0.1:3902/api/v1/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev',
      url: 'http://127.0.0.1:3600',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        NEXT_PUBLIC_API_URL: '/api/v1',
        API_URL: 'http://localhost:3902/api/v1',
        API_BASE_URL: 'http://localhost:3902',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3600',
        NEXT_PUBLIC_BYPASS_PAYMENT: 'true',
        BYPASS_PAYMENT: 'true',
        DATABASE_URL:
          'postgresql://nexus:nexus_secret@localhost:5433/nexus_e2e_db',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
          process.env.E2E_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_e2e_placeholder',
      },
    },
  ],
});

