import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/test-results',
  timeout: 90_000,
  retries: 0,
  fullyParallel: false,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    screenshot: 'only-on-failure'
  }
})
