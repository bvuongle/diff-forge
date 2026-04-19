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
  dirty: boolean
  selectedNodeIds: Set<string>
  selectedEdgeIds: Set<string>
  setGraph: (graph: Graph) => void
  markClean: () => void
  addNode: (node: GraphNode) => void
  removeNode: (nodeId: string) => void
  addEdge: (edge: GraphEdge) => void
  removeEdge: (edgeId: string) => void
  moveNode: (nodeId: string, position: Position) => void
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void
  renameNode: (oldId: string, newId: string) => void
  selectNode: (nodeId: string | null) => void
  selectEdge: (edgeId: string | null) => void
  selectElements: (nodeIds: string[], edgeIds: string[]) => void
  clearSelection: () => void
  removeSelected: () => void
}

const useGraphStore = create<GraphStore>()(
  subscribeWithSelector((set) => ({
    graph: { nodes: [], edges: [] },
    dirty: false,
    selectedNodeIds: new Set(),
    selectedEdgeIds: new Set(),

    setGraph: (graph) =>
      set({
        graph,
        dirty: false,
        selectedNodeIds: new Set(),
        selectedEdgeIds: new Set()
      }),

    markClean: () => set({ dirty: false }),

    addNode: (node) =>
      set((state) => ({
        graph: addNode(state.graph, node),
        dirty: true
      })),

    removeNode: (nodeId) =>
      set((state) => {
        const next = new Set(state.selectedNodeIds)
        next.delete(nodeId)
        return {
          graph: removeNode(state.graph, nodeId),
          selectedNodeIds: next,
          dirty: true
        }
      }),

    addEdge: (edge) =>
      set((state) => ({
        graph: addEdge(state.graph, edge),
        dirty: true
      })),

    removeEdge: (edgeId) =>
      set((state) => {
        const nextEdgeIds = new Set(state.selectedEdgeIds)
        nextEdgeIds.delete(edgeId)
        return {
          graph: removeEdge(state.graph, edgeId),
          selectedEdgeIds: nextEdgeIds,
          dirty: true
        }
      }),

    moveNode: (nodeId, position) =>
      set((state) => ({
        graph: moveNode(state.graph, nodeId, position),
        dirty: true
      })),

    updateNodeConfig: (nodeId, config) =>
      set((state) => ({
        graph: updateNodeConfig(state.graph, nodeId, config),
        dirty: true
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
          selectedNodeIds: next,
          dirty: true
        }
      }),

    selectNode: (nodeId) =>
      set({
        selectedNodeIds: nodeId ? new Set([nodeId]) : new Set(),
        selectedEdgeIds: new Set()
      }),

    selectEdge: (edgeId) =>
      set({
        selectedEdgeIds: edgeId ? new Set([edgeId]) : new Set(),
        selectedNodeIds: new Set()
      }),

    selectElements: (nodeIds, edgeIds) =>
      set({
        selectedNodeIds: new Set(nodeIds),
        selectedEdgeIds: new Set(edgeIds)
      }),

    clearSelection: () => set({ selectedNodeIds: new Set(), selectedEdgeIds: new Set() }),

    removeSelected: () =>
      set((state) => {
        let g = state.graph
        for (const nodeId of state.selectedNodeIds) {
          g = removeNode(g, nodeId)
        }
        for (const edgeId of state.selectedEdgeIds) {
          g = removeEdge(g, edgeId)
        }
        return { graph: g, selectedNodeIds: new Set(), selectedEdgeIds: new Set(), dirty: true }
      })
  }))
)

export { useGraphStore }
