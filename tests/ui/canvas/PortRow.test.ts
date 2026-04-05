import { describe, it, expect } from 'vitest'
import { getPortDragState } from '@ui/canvas/PortRow'
import type { Slot } from '@domain/graph/GraphTypes'

function makeSlot(overrides?: Partial<Slot>): Slot {
  return {
    name: 'transport',
    interface: 'ILink',
    direction: 'in',
    maxConnections: 1,
    ...overrides
  }
}

describe('getPortDragState', () => {
  it('returns idle when no drag is active', () => {
    const slot = makeSlot()
    expect(getPortDragState(slot, 'nodeA', null)).toBe('idle')
  })

  it('returns dimmed for the source node itself', () => {
    const slot = makeSlot()
    const dragInfo = { sourceNodeId: 'nodeA', sourceInterfaces: ['ILink'] }
    expect(getPortDragState(slot, 'nodeA', dragInfo)).toBe('dimmed')
  })

  it('returns dimmed for output ports on other nodes', () => {
    const slot = makeSlot({ direction: 'out' })
    const dragInfo = { sourceNodeId: 'nodeA', sourceInterfaces: ['ILink'] }
    expect(getPortDragState(slot, 'nodeB', dragInfo)).toBe('dimmed')
  })

  it('returns valid for input port with matching interface', () => {
    const slot = makeSlot({ direction: 'in', interface: 'ILink' })
    const dragInfo = { sourceNodeId: 'nodeA', sourceInterfaces: ['ILink'] }
    expect(getPortDragState(slot, 'nodeB', dragInfo)).toBe('valid')
  })

  it('returns dimmed for input port with non-matching interface', () => {
    const slot = makeSlot({ direction: 'in', interface: 'IMonitor' })
    const dragInfo = { sourceNodeId: 'nodeA', sourceInterfaces: ['ILink'] }
    expect(getPortDragState(slot, 'nodeB', dragInfo)).toBe('dimmed')
  })

  it('returns valid when source has multiple interfaces and one matches', () => {
    const slot = makeSlot({ direction: 'in', interface: 'IMonitor' })
    const dragInfo = { sourceNodeId: 'nodeA', sourceInterfaces: ['ILink', 'IMonitor'] }
    expect(getPortDragState(slot, 'nodeB', dragInfo)).toBe('valid')
  })

  it('returns dimmed when source interfaces array is empty', () => {
    const slot = makeSlot({ direction: 'in', interface: 'ILink' })
    const dragInfo = { sourceNodeId: 'nodeA', sourceInterfaces: [] }
    expect(getPortDragState(slot, 'nodeB', dragInfo)).toBe('dimmed')
  })
})
