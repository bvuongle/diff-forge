import type { CatalogSource } from '@contracts/CatalogSource'

const ipcCatalogSource: CatalogSource = {
  async loadCatalog() {
    if (typeof window === 'undefined' || !window.electronAPI) {
      return { status: 'error', message: 'Electron bridge unavailable', repos: [] }
    }
    return window.electronAPI.catalog.load()
  }
}

export { ipcCatalogSource }
