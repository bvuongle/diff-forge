import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
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
      '@contracts': '/src/contracts',
      '@adapters': '/src/adapters',
      '@state': '/src/state',
      '@canvas': '/src/components/canvas',
      '@catalog': '/src/components/catalog',
      '@topbar': '/src/components/topbar',
      '@layout': '/src/components/layout',
      '@testing': '/src/testing'
    }
  }
})
