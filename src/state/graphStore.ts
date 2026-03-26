import { create } from 'zustand'
import { Graph, GraphNode, GraphEdge, Position } from '../domain/graph/GraphTypes'
import {
  addNode,
  removeNode,
  addEdge,
  removeEdge,
  moveNode,
  updateNodeConfig
} from '../domain/graph/GraphOperations'

type GraphStore = {
  graph: Graph
  selectedNodeId: string | null
  selectedEdgeId: string | null
  addNode: (node: GraphNode) => void
  removeNode: (nodeId: string) => void
  addEdge: (edge: GraphEdge) => void
  removeEdge: (edgeId: string) => void
  moveNode: (nodeId: string, position: Position) => void
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void
  selectNode: (nodeId: string | null) => void
  selectEdge: (edgeId: string | null) => void
}

const useGraphStore = create<GraphStore>((set) => ({
  graph: { nodes: [], edges: [] },
  selectedNodeId: null,
  selectedEdgeId: null,

  addNode: (node) =>
    set((state) => ({
      graph: addNode(state.graph, node)
    })),

  removeNode: (nodeId) =>
    set((state) => ({
      graph: removeNode(state.graph, nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
    })),

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

  selectNode: (nodeId) =>
    set({ selectedNodeId: nodeId, selectedEdgeId: null }),

  selectEdge: (edgeId) =>
    set({ selectedEdgeId: edgeId, selectedNodeId: null })
}))

export { useGraphStore }
export type { GraphStore }
