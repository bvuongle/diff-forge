import { Slot } from '@domain/graph/GraphTypes'

type DragInfo = { sourceNodeId: string; sourceInterfaces: string[] }

function getPortDragState(slot: Slot, nodeId: string, dragInfo: DragInfo | null): 'idle' | 'valid' | 'dimmed' {
  if (!dragInfo) return 'idle'
  if (nodeId === dragInfo.sourceNodeId) return 'dimmed'
  if (slot.direction === 'out') return 'dimmed'
  return dragInfo.sourceInterfaces.includes(slot.interface) ? 'valid' : 'dimmed'
}

export { getPortDragState }
export type { DragInfo }
