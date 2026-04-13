import { create } from 'zustand'

type DragInfo = {
  sourceNodeId: string
  sourceInterfaces: string[]
}

type CanvasMode = 'select' | 'pan'

type UIStore = {
  searchQuery: string
  setSearchQuery: (query: string) => void
  expandedNodeIds: Set<string>
  toggleNodeExpanded: (nodeId: string) => void
  expandAll: (nodeIds: string[]) => void
  collapseAll: () => void
  dragInfo: DragInfo | null
  setDragInfo: (info: DragInfo | null) => void
  nodeWidths: Record<string, number>
  setNodeWidth: (nodeId: string, width: number) => void
  canvasMode: CanvasMode
  setCanvasMode: (mode: CanvasMode) => void
}

const useUIStore = create<UIStore>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
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
  dragInfo: null,
  setDragInfo: (info) => set({ dragInfo: info }),
  nodeWidths: {},
  setNodeWidth: (nodeId, width) =>
    set((s) => {
      if (s.nodeWidths[nodeId] === width) return s
      return { nodeWidths: { ...s.nodeWidths, [nodeId]: width } }
    }),
  canvasMode: 'select',
  setCanvasMode: (mode) => set({ canvasMode: mode })
}))

export { useUIStore }
export type { UIStore }
