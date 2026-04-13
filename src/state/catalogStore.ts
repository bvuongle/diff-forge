import { create } from 'zustand'

import { CatalogDocument } from '@domain/catalog/CatalogTypes'

type CatalogStore = {
  catalog: CatalogDocument | null
  loading: boolean
  error: string | null
  setCatalog: (catalog: CatalogDocument) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const useCatalogStore = create<CatalogStore>((set) => ({
  catalog: null,
  loading: false,
  error: null,
  setCatalog: (catalog) => set({ catalog }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}))

export { useCatalogStore }
export type { CatalogStore }
