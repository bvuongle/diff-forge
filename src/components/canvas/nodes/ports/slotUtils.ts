import type { Graph } from '@domain/graph/GraphTypes'

type EdgeSourceMap = Record<string, string[]>

function getSlotTooltip(edgeSourceMap: EdgeSourceMap, slotName: string): string {
  const sources = edgeSourceMap[slotName]
  return sources?.length ? sources.join(', ') : ''
}

function getEdgeSourceMap(nodeId: string, graph: Graph): EdgeSourceMap {
  const map: EdgeSourceMap = {}
  for (const edge of graph.edges) {
    if (edge.targetNodeId !== nodeId) continue
    const src = graph.nodes.find((n) => n.id === edge.sourceNodeId)
    if (!src) continue
    if (!map[edge.targetSlot]) map[edge.targetSlot] = []
    map[edge.targetSlot].push(src.instanceId)
  }
  return map
}

export { getSlotTooltip, getEdgeSourceMap }
export type { EdgeSourceMap }
