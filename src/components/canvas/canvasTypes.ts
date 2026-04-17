import { MarkerType, type Edge, type Node } from '@xyflow/react'

import type { GraphEdge, GraphNode } from '@domain/graph/GraphTypes'

import { OUT_HANDLE_ID } from './canvasConstants'

type CanvasNodeData = {
  graphNode: GraphNode
  [key: string]: unknown
}

type CanvasEdgeData = {
  graphEdge: GraphEdge
  [key: string]: unknown
}

type CanvasNode = Node<CanvasNodeData, 'component'>
type CanvasEdge = Edge<CanvasEdgeData, 'component'>

type DragInfo = { sourceNodeId: string; sourceInterfaces: string[] }
type EdgeSourceMap = Record<string, string[]>

function toCanvasNodes(graphNodes: GraphNode[]): CanvasNode[] {
  return graphNodes.map((node) => ({
    id: node.id,
    type: 'component' as const,
    position: node.position,
    data: { graphNode: node }
  }))
}

function toCanvasEdges(graphEdges: GraphEdge[]): CanvasEdge[] {
  return graphEdges.map((edge) => ({
    id: edge.id,
    type: 'component' as const,
    source: edge.sourceNodeId,
    sourceHandle: OUT_HANDLE_ID,
    target: edge.targetNodeId,
    targetHandle: edge.targetSlot,
    markerEnd: { type: MarkerType.Arrow, width: 16, height: 16, color: 'var(--edge-default)' },
    data: { graphEdge: edge }
  }))
}

export { toCanvasNodes, toCanvasEdges }
export type { CanvasNode, CanvasEdge, CanvasNodeData, CanvasEdgeData, DragInfo, EdgeSourceMap }
