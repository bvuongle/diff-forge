import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

import {
  addEdge,
  addNode,
  moveNode,
  removeEdge,
  removeNode,
  renameNode,
  updateNodeConfig
} from '@domain/graph/GraphOperations'
import { Graph, GraphEdge, GraphNode, Position } from '@domain/graph/GraphTypes'

type GraphStore = {
  graph: Graph
  selectedNodeIds: Set<string>
  selectedEdgeId: string | null
  addNode: (node: GraphNode) => void
  removeNode: (nodeId: string) => void
  addEdge: (edge: GraphEdge) => void
  removeEdge: (edgeId: string) => void
  moveNode: (nodeId: string, position: Position) => void
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void
  renameNode: (oldId: string, newId: string) => void
  selectNode: (nodeId: string | null, additive?: boolean) => void
  selectNodes: (nodeIds: string[]) => void
  selectEdge: (edgeId: string | null) => void
  clearSelection: () => void
  removeSelectedNodes: () => void
}

const useGraphStore = create<GraphStore>()(
  subscribeWithSelector((set) => ({
    graph: { nodes: [], edges: [] },
    selectedNodeIds: new Set(),
    selectedEdgeId: null,

    addNode: (node) =>
      set((state) => ({
        graph: addNode(state.graph, node)
      })),

    removeNode: (nodeId) =>
      set((state) => {
        const next = new Set(state.selectedNodeIds)
        next.delete(nodeId)
        return {
          graph: removeNode(state.graph, nodeId),
          selectedNodeIds: next
        }
      }),

    addEdge: (edge) =>
      set((state) => ({
        graph: addEdge(state.graph, edge)
      })),

    removeEdge: (edgeId) =>
      set((state) => ({
        graph: removeEdge(state.graph, edgeId),
        selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId
      })),

    moveNode: (nodeId, position) =>
      set((state) => ({
        graph: moveNode(state.graph, nodeId, position)
      })),

    updateNodeConfig: (nodeId, config) =>
      set((state) => ({
        graph: updateNodeConfig(state.graph, nodeId, config)
      })),

    renameNode: (oldId, newId) =>
      set((state) => {
        const next = new Set(state.selectedNodeIds)
        if (next.has(oldId)) {
          next.delete(oldId)
          next.add(newId)
        }
        return {
          graph: renameNode(state.graph, oldId, newId),
          selectedNodeIds: next
        }
      }),

    selectNode: (nodeId, additive = false) =>
      set((state) => {
        if (nodeId === null) return { selectedNodeIds: new Set(), selectedEdgeId: null }
        if (additive) {
          const next = new Set(state.selectedNodeIds)
          if (next.has(nodeId)) next.delete(nodeId)
          else next.add(nodeId)
          return { selectedNodeIds: next, selectedEdgeId: null }
        }
        return { selectedNodeIds: new Set([nodeId]), selectedEdgeId: null }
      }),

    selectNodes: (nodeIds) => set({ selectedNodeIds: new Set(nodeIds), selectedEdgeId: null }),

    selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeIds: new Set() }),

    clearSelection: () => set({ selectedNodeIds: new Set(), selectedEdgeId: null }),

    removeSelectedNodes: () =>
      set((state) => {
        let g = state.graph
        for (const nodeId of state.selectedNodeIds) {
          g = removeNode(g, nodeId)
        }
        return { graph: g, selectedNodeIds: new Set(), selectedEdgeId: null }
      })
  }))
)

export { useGraphStore }
