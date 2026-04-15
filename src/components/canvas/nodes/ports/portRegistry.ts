import { useUIStore } from '@state/uiStore'

type PortKey = string

function makePortKey(nodeId: string, slotName: string, direction: 'in' | 'out'): PortKey {
  return `${nodeId}:${slotName}:${direction}`
}

function measurePortOffset(portEl: HTMLElement): { offsetX: number; offsetY: number } | null {
  const nodeEl = portEl.closest('[data-node-container]') as HTMLElement | null
  if (!nodeEl) return null
  const portRect = portEl.getBoundingClientRect()
  const nodeRect = nodeEl.getBoundingClientRect()
  // getBoundingClientRect returns screen-space (scaled) values;
  // derive scale from node element to convert back to canvas coordinates
  const scale = nodeEl.offsetWidth > 0 ? nodeRect.width / nodeEl.offsetWidth : 1
  return {
    offsetX: (portRect.left + portRect.width / 2 - nodeRect.left) / scale,
    offsetY: (portRect.top + portRect.height / 2 - nodeRect.top) / scale
  }
}

function registerPort(nodeId: string, slotName: string, direction: 'in' | 'out', portEl: HTMLElement) {
  const offset = measurePortOffset(portEl)
  if (!offset) return
  const key = makePortKey(nodeId, slotName, direction)
  useUIStore.getState().setPortOffset(key, offset.offsetX, offset.offsetY)
}

function unregisterPort(nodeId: string, slotName: string, direction: 'in' | 'out') {
  const key = makePortKey(nodeId, slotName, direction)
  useUIStore.getState().removePortOffset(key)
}

export { registerPort, unregisterPort, makePortKey }
