import type { Graph, GraphEdge, Slot } from '@core/graph/GraphTypes'
import type { DragInfo, EdgeSourceMap } from '@canvas/canvasTypes'

function getConnectionCounts(nodeId: string, edges: GraphEdge[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const e of edges) {
    if (e.sourceNodeId === nodeId) counts.set(e.sourceSlot, (counts.get(e.sourceSlot) ?? 0) + 1)
    if (e.targetNodeId === nodeId) counts.set(e.targetSlot, (counts.get(e.targetSlot) ?? 0) + 1)
  }
  return counts
}

function getPortDragState(slot: Slot, nodeId: string, dragInfo: DragInfo | null): 'idle' | 'valid' | 'dimmed' {
  if (!dragInfo) return 'idle'
  if (nodeId === dragInfo.sourceNodeId) return 'dimmed'
  if (slot.direction === 'out') return 'dimmed'
  return dragInfo.sourceInterfaces.includes(slot.interface) ? 'valid' : 'dimmed'
}

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

export { getConnectionCounts, getPortDragState, getSlotTooltip, getEdgeSourceMap, isNodeDimmed }
