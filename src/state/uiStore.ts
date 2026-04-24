import { create } from 'zustand'

import type { SearchMode } from '@domain/catalog/searchCatalog'

type CanvasMode = 'select' | 'pan'

type UIStore = {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchMode: SearchMode
  setSearchMode: (mode: SearchMode) => void
  expandedNodeIds: Set<string>
  toggleNodeExpanded: (nodeId: string) => void
  expandAll: (nodeIds: string[]) => void
  collapseAll: () => void
  canvasMode: CanvasMode
  setCanvasMode: (mode: CanvasMode) => void
  snapToGrid: boolean
  toggleSnapToGrid: () => void
  animateEdges: boolean
  toggleAnimateEdges: () => void
  switchConfirmOpen: boolean
  setSwitchConfirmOpen: (open: boolean) => void
}

const useUIStore = create<UIStore>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchMode: 'name',
  setSearchMode: (mode) => set({ searchMode: mode }),
  expandedNodeIds: new Set(),
  toggleNodeExpanded: (nodeId) =>
    set((s) => {
      const next = new Set(s.expandedNodeIds)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return { expandedNodeIds: next }
    }),
  expandAll: (nodeIds) => set({ expandedNodeIds: new Set(nodeIds) }),
  collapseAll: () => set({ expandedNodeIds: new Set() }),
  canvasMode: 'select',
  setCanvasMode: (mode) => set({ canvasMode: mode }),
  snapToGrid: false,
  toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  animateEdges: false,
  toggleAnimateEdges: () => set((s) => ({ animateEdges: !s.animateEdges })),
  switchConfirmOpen: false,
  setSwitchConfirmOpen: (open) => set({ switchConfirmOpen: open })
}))

export { useUIStore }
