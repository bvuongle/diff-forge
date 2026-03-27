import { create } from 'zustand'

type UIStore = {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const useUIStore = create<UIStore>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query })
}))

export { useUIStore }
export type { UIStore }
