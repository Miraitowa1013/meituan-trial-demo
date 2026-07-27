import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:8787',
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
