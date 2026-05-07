import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  webServer: {
    command: 'npm run pages-preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
  },
})
