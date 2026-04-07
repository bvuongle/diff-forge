import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import electronRenderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'src/electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      },
      {
        entry: 'src/electron/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            lib: {
              entry: 'src/electron/preload.ts',
              formats: ['cjs']
            },
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      }
    ]),
    electronRenderer()
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true
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
