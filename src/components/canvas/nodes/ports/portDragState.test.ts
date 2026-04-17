import { describe, expect, it } from 'vitest'

import type { Slot } from '@domain/graph/GraphTypes'

import { getPortDragState } from './portDragState'

const makeSlot = (overrides?: Partial<Slot>): Slot => ({
  name: 'transport',
  interface: 'ILink',
  direction: 'in',
  maxConnections: 1,
  ...overrides
})

describe('getPortDragState', () => {
  it('returns idle when dragInfo is null', () => {
    expect(getPortDragState(makeSlot(), 'n1', null)).toBe('idle')
  })

  it('returns dimmed when slot belongs to the dragging node', () => {
    const dragInfo = { sourceNodeId: 'n1', sourceInterfaces: ['ILink'] }
    expect(getPortDragState(makeSlot(), 'n1', dragInfo)).toBe('dimmed')
  })

  it('returns dimmed for output slots', () => {
    const dragInfo = { sourceNodeId: 'other', sourceInterfaces: ['ILink'] }
    expect(getPortDragState(makeSlot({ direction: 'out' }), 'n1', dragInfo)).toBe('dimmed')
  })

  it('returns valid when slot interface matches source interfaces', () => {
    const dragInfo = { sourceNodeId: 'other', sourceInterfaces: ['ILink', 'IMonitor'] }
    expect(getPortDragState(makeSlot({ interface: 'ILink' }), 'n1', dragInfo)).toBe('valid')
  })

  it('returns dimmed when slot interface does not match', () => {
    const dragInfo = { sourceNodeId: 'other', sourceInterfaces: ['IMonitor'] }
    expect(getPortDragState(makeSlot({ interface: 'ILink' }), 'n1', dragInfo)).toBe('dimmed')
  })
})
