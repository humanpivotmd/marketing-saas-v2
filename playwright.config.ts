import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env.test') })

export default defineConfig({
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
  testDir: './tests',
  timeout: 180000,
  retries: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  outputDir: './test-results',
  projects: [
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },
    {
      name: 'smoke',
      testMatch: /smoke\.spec\.ts/,
      use: {
        browserName: 'chromium',
        storageState: './tests/.auth/session.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      testIgnore: [/mobile\.spec\.ts/, /scenario-.*\.spec\.ts/],
      use: {
        browserName: 'chromium',
        storageState: './tests/.auth/session.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'scenario',
      testDir: './tests/e2e',
      testMatch: /scenario-.*\.spec\.ts/,
      use: {
        browserName: 'chromium',
      },
      timeout: 300000,
    },
    {
      name: 'mobile-iphone',
      testMatch: /mobile\.spec\.ts/,
      testDir: './tests/e2e',
      use: {
        ...devices['iPhone 13'],
        storageState: './tests/.auth/session.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-galaxy',
      testMatch: /mobile\.spec\.ts/,
      testDir: './tests/e2e',
      use: {
        ...devices['Galaxy S III'],
        storageState: './tests/.auth/session.json',
      },
      dependencies: ['setup'],
    },
  ],
})
