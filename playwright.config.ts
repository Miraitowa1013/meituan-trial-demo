import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4178', channel: 'chrome', viewport: { width: 430, height: 932 } },
  webServer: [
    {
      command: 'node scripts/prepare-e2e-db.mjs && npm run dev:api',
      url: 'http://127.0.0.1:8791/api/health',
      reuseExistingServer: false,
      env: { DATABASE_URL: 'file:./data/e2e.db', API_PORT: '8791' },
    },
    {
      command: 'npm run dev:web -- --port 4178 --strictPort',
      url: 'http://127.0.0.1:4178',
      reuseExistingServer: false,
      env: { API_PROXY_TARGET: 'http://127.0.0.1:8791' },
    },
  ],
})
