import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './recording',
  workers: 1,
  timeout: 180_000,
  use: { baseURL: 'http://127.0.0.1:4173', channel: 'chrome' },
  webServer: [
    {
      command: 'npm run dev:api',
      url: 'http://127.0.0.1:8787/api/health',
      reuseExistingServer: true,
      env: { DATABASE_URL: 'file:./data/video.db' },
    },
    {
      command: 'npm run dev:web -- --port 4173 --strictPort',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: true,
    },
  ],
})
