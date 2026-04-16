import type { GraphEdge } from '@domain/graph/GraphTypes'

function isNodeDimmed(
  nodeId: string,
  selectedNodeIds: Set<string>,
  selectedEdgeIds: Set<string>,
  edges: GraphEdge[]
): boolean {
  if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return false
  if (selectedNodeIds.size > 0) {
    if (selectedNodeIds.has(nodeId)) return false
    for (const selectedId of selectedNodeIds) {
      for (const e of edges) {
        if (e.sourceNodeId === selectedId && e.targetNodeId === nodeId) return false
        if (e.targetNodeId === selectedId && e.sourceNodeId === nodeId) return false
      }
    }
    return true
  }
  for (const edgeId of selectedEdgeIds) {
    const edge = edges.find((e) => e.id === edgeId)
    if (edge && (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId)) return false
  }
  return true
}

function isEdgeDimmed(
  edge: GraphEdge | undefined,
  edgeId: string,
  selectedNodeIds: Set<string>,
  selectedEdgeIds: Set<string>
): boolean {
  if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return false
  if (selectedNodeIds.size > 0) {
    if (!edge) return true
    for (const nodeId of selectedNodeIds) {
      if (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId) return false
    }
    return true
  }
  return !selectedEdgeIds.has(edgeId)
}

export { isNodeDimmed, isEdgeDimmed }
