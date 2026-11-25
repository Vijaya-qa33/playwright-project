
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const authFile = path.resolve(
  process.cwd(),
  'playwright',
  '.auth',
  'amazon.json'
);
const desktopChrome = {
  ...devices['Desktop Chrome'],
  channel: 'chrome' as const
};

export default defineConfig({

  // Test files location
  testDir: './tests',

  // Run tests one by one
  fullyParallel: false,

  // No retries
  retries: 0,

  // Run one test at a time
  workers: 1,

  // HTML and Allure reports
  reporter: [
    ['html'],
    ['allure-playwright']
  ],

  // Common browser settings
  use: {
    headless: false,
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.spec\.ts/,
      use: desktopChrome
    },
    {
      name: 'Google Chrome',
      testIgnore: [
        /auth\.setup\.spec\.ts/,
        /Wishlist\.spec\.ts/
      ],
      use: desktopChrome
    },
    {
      name: 'Wishlist Chrome',
      testMatch: /Wishlist\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...desktopChrome,
        storageState: authFile
      },
    },
  ],

});
