import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig, type PluginOption } from 'vite'
import electron from 'vite-plugin-electron'

const PRELOAD_SRC = resolve(__dirname, 'src/electron/preload.cjs')
const PRELOAD_OUT_DIR = resolve(__dirname, 'dist-electron')
const PRELOAD_OUT = resolve(PRELOAD_OUT_DIR, 'preload.cjs')

const srcAliases = {
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

function copyPreloadPlugin(): PluginOption {
  const copy = () => {
    if (!existsSync(PRELOAD_OUT_DIR)) mkdirSync(PRELOAD_OUT_DIR, { recursive: true })
    copyFileSync(PRELOAD_SRC, PRELOAD_OUT)
  }
  return {
    name: 'diff-forge-copy-preload',
    buildStart() {
      copy()
      this.addWatchFile(PRELOAD_SRC)
    },
    handleHotUpdate({ file, server }) {
      if (file === PRELOAD_SRC) {
        copy()
        server.ws.send({ type: 'full-reload' })
      }
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    copyPreloadPlugin(),
    electron([
      {
        entry: 'src/electron/main.ts',
        vite: {
          resolve: { alias: srcAliases },
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      }
    ])
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  resolve: {
    alias: srcAliases
  }
})
