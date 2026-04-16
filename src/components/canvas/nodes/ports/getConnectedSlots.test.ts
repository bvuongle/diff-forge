import { makeEdge } from '@testing/fixtures'
import { describe, expect, it } from 'vitest'

import { getConnectionCounts } from './getConnectedSlots'

describe('getConnectionCounts', () => {
  it('returns empty map when no edges', () => {
    const result = getConnectionCounts('nodeA', [])
    expect(result.size).toBe(0)
  })

  it('returns source slot count for source node', () => {
    const edges = [makeEdge('e1', 'nodeA', 'nodeB')]
    const result = getConnectionCounts('nodeA', edges)
    expect(result.get('ILink')).toBe(1)
    expect(result.size).toBe(1)
  })

  it('returns target slot count for target node', () => {
    const edges = [makeEdge('e1', 'nodeA', 'nodeB')]
    const result = getConnectionCounts('nodeB', edges)
    expect(result.get('transport')).toBe(1)
    expect(result.size).toBe(1)
  })

  it('returns empty map for unrelated node', () => {
    const edges = [makeEdge('e1', 'nodeA', 'nodeB')]
    const result = getConnectionCounts('nodeC', edges)
    expect(result.size).toBe(0)
  })

  it('collects counts from multiple edges', () => {
    const edges = [makeEdge('e1', 'nodeA', 'nodeB'), makeEdge('e2', 'nodeC', 'nodeA', { targetSlot: 'data' })]
    const result = getConnectionCounts('nodeA', edges)
    expect(result.get('ILink')).toBe(1)
    expect(result.get('data')).toBe(1)
    expect(result.size).toBe(2)
  })

  it('counts multiple connections to same slot', () => {
    const edges = [makeEdge('e1', 'nodeA', 'nodeB'), makeEdge('e2', 'nodeC', 'nodeB')]
    const result = getConnectionCounts('nodeB', edges)
    expect(result.get('transport')).toBe(2)
  })
})
