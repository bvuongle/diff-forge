import { makeEdge } from '@testing/fixtures'
import { describe, expect, it } from 'vitest'

import { getConnectedSlots } from './getConnectedSlots'

describe('getConnectedSlots', () => {
  it('returns empty set when no edges', () => {
    const result = getConnectedSlots('nodeA', [])
    expect(result.size).toBe(0)
  })

  it('returns source slot for source node', () => {
    const edges = [makeEdge('e1', 'nodeA', 'nodeB')]
    const result = getConnectedSlots('nodeA', edges)
    expect(result.has('ILink')).toBe(true)
    expect(result.size).toBe(1)
  })

  it('returns target slot for target node', () => {
    const edges = [makeEdge('e1', 'nodeA', 'nodeB')]
    const result = getConnectedSlots('nodeB', edges)
    expect(result.has('transport')).toBe(true)
    expect(result.size).toBe(1)
  })

  it('returns empty set for unrelated node', () => {
    const edges = [makeEdge('e1', 'nodeA', 'nodeB')]
    const result = getConnectedSlots('nodeC', edges)
    expect(result.size).toBe(0)
  })

  it('collects slots from multiple edges', () => {
    const edges = [makeEdge('e1', 'nodeA', 'nodeB'), makeEdge('e2', 'nodeC', 'nodeA', { targetSlot: 'data' })]
    const result = getConnectedSlots('nodeA', edges)
    expect(result.has('ILink')).toBe(true)
    expect(result.has('data')).toBe(true)
    expect(result.size).toBe(2)
  })
})
