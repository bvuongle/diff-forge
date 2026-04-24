import { create } from 'zustand'

import type { CatalogStatus } from '@domain/catalog/CatalogStatus'
import type { CatalogDocument } from '@domain/catalog/CatalogTypes'

type CatalogStore = {
  status: CatalogStatus
  catalog: CatalogDocument | null
  setStatus: (status: CatalogStatus) => void
}

function catalogFromStatus(status: CatalogStatus): CatalogDocument | null {
  if (status.status === 'ready' || status.status === 'partial') return status.catalog
  return null
}

const useCatalogStore = create<CatalogStore>((set) => ({
  status: { status: 'loading' },
  catalog: null,
  setStatus: (status) => set({ status, catalog: catalogFromStatus(status) })
}))

export { useCatalogStore }
