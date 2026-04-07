import type { GraphEdge } from '@domain/graph/GraphTypes'

function getConnectedSlots(nodeId: string, edges: GraphEdge[]): Set<string> {
  const slots = new Set<string>()
  for (const e of edges) {
    if (e.sourceNodeId === nodeId) slots.add(e.sourceSlot)
    if (e.targetNodeId === nodeId) slots.add(e.targetSlot)
  }
  return slots
}

export { getConnectedSlots }
