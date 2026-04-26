import { create } from 'zustand'

import type { CatalogDocument } from '@core/catalog/CatalogSchema'
import type { CatalogLoadOutcome } from '@contracts/CatalogSource'

type CatalogStatus = CatalogLoadOutcome | { status: 'loading' }

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
export type { CatalogStatus }
