import type { CatalogSource } from '@contracts/CatalogSource'

function createIpcCatalogSource(): CatalogSource {
  return {
    async loadCatalog() {
      if (typeof window === 'undefined' || !window.electronAPI) {
        return { status: 'error', message: 'Electron bridge unavailable', repos: [] }
      }
      return window.electronAPI.catalog.load()
    }
  }
}

const ipcCatalogSource = createIpcCatalogSource()

export { createIpcCatalogSource, ipcCatalogSource }
