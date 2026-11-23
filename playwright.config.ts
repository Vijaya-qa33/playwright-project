
import { defineConfig, devices } from '@playwright/test';

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

  // Use actual Google Chrome
  projects: [
    {
      name: 'Google Chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],

});
