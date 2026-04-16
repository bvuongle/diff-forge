import type { GraphEdge } from '@domain/graph/GraphTypes'

function getConnectionCounts(nodeId: string, edges: GraphEdge[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const e of edges) {
    if (e.sourceNodeId === nodeId) counts.set(e.sourceSlot, (counts.get(e.sourceSlot) ?? 0) + 1)
    if (e.targetNodeId === nodeId) counts.set(e.targetSlot, (counts.get(e.targetSlot) ?? 0) + 1)
  }
  return counts
}

export { getConnectionCounts }
