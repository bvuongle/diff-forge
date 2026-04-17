import type { GraphEdge } from '@domain/graph/GraphTypes'

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

export { isEdgeDimmed }
