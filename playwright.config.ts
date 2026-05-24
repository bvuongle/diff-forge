import { defineConfig } from '@playwright/test'

const RUN_PACKAGED = Boolean(process.env.DIFF_FORGE_BIN)

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/test-results',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /packaged-app\.spec\.ts/,
      use: { browserName: 'chromium' }
    },
    ...(RUN_PACKAGED
      ? [
          {
            name: 'electron-packaged',
            testMatch: /packaged-app\.spec\.ts/,
            use: {}
          }
        ]
      : [])
  ],
  webServer: RUN_PACKAGED
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 30_000
      }
})
