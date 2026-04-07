import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/**/*.d.ts'],
      reporter: ['text', 'html', 'lcov']
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@domain': '/src/domain',
      '@ports': '/src/ports',
      '@adapters': '/src/adapters',
      '@state': '/src/state',
      '@canvas': '/src/canvas',
      '@testing': '/src/testing'
    }
  }
})
