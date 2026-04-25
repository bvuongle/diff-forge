import { create } from 'zustand'

import { type SearchMode } from '@domain/catalog/searchCatalog'

type CanvasMode = 'select' | 'pan'

const CATALOG_COLLAPSED_STORAGE_KEY = 'diff-forge.catalogPanelCollapsed'

function readSavedCatalogCollapsed(): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    return localStorage.getItem(CATALOG_COLLAPSED_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function persistCatalogCollapsed(collapsed: boolean): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(CATALOG_COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0')
  } catch {
    // ignore quota/security errors
  }
}

type UIStore = {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchMode: SearchMode
  setSearchMode: (mode: SearchMode) => void
  sourceFilters: Set<string>
  toggleSourceFilter: (source: string) => void
  clearSourceFilters: () => void
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
  catalogPanelCollapsed: boolean
  toggleCatalogPanelCollapsed: () => void
}

const useUIStore = create<UIStore>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchMode: 'name',
  setSearchMode: (mode) => set({ searchMode: mode }),
  sourceFilters: new Set(),
  toggleSourceFilter: (source) =>
    set((s) => {
      const next = new Set(s.sourceFilters)
      if (next.has(source)) next.delete(source)
      else next.add(source)
      return { sourceFilters: next }
    }),
  clearSourceFilters: () => set({ sourceFilters: new Set() }),
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
  setSwitchConfirmOpen: (open) => set({ switchConfirmOpen: open }),
  catalogPanelCollapsed: readSavedCatalogCollapsed(),
  toggleCatalogPanelCollapsed: () =>
    set((s) => {
      const next = !s.catalogPanelCollapsed
      persistCatalogCollapsed(next)
      return { catalogPanelCollapsed: next }
    })
}))

export { useUIStore }
