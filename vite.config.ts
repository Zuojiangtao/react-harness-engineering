import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    // antd + MSW 的 demo chunk 偏大，先放宽告警阈值；上线前按路由拆分
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    pool: 'threads',
    testTimeout: 15_000,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'scripts/**/*.test.mjs'],
    coverage: {
      provider: 'v8',
      include: ['src/shared/**', 'src/features/**/schema.ts'],
      thresholds: { lines: 80, functions: 80, branches: 70 },
      reporter: ['text', 'html'],
    },
  },
})
