import { describe, it, expect } from 'vitest'
import { getConnectedSlots } from '@ui/canvas/getConnectedSlots'
import type { GraphEdge } from '@domain/graph/GraphTypes'

function makeEdge(overrides: Partial<GraphEdge> & { id: string }): GraphEdge {
  return {
    sourceNodeId: 'nodeA',
    sourceSlot: 'ILink',
    targetNodeId: 'nodeB',
    targetSlot: 'transport',
    ...overrides
  }
}

describe('getConnectedSlots', () => {
  it('returns empty set when no edges', () => {
    const result = getConnectedSlots('nodeA', [])
    expect(result.size).toBe(0)
  })

  it('returns source slot for source node', () => {
    const edges = [makeEdge({ id: 'e1' })]
    const result = getConnectedSlots('nodeA', edges)
    expect(result.has('ILink')).toBe(true)
    expect(result.size).toBe(1)
  })

  it('returns target slot for target node', () => {
    const edges = [makeEdge({ id: 'e1' })]
    const result = getConnectedSlots('nodeB', edges)
    expect(result.has('transport')).toBe(true)
    expect(result.size).toBe(1)
  })

  it('returns empty set for unrelated node', () => {
    const edges = [makeEdge({ id: 'e1' })]
    const result = getConnectedSlots('nodeC', edges)
    expect(result.size).toBe(0)
  })

  it('collects slots from multiple edges', () => {
    const edges = [
      makeEdge({ id: 'e1', sourceNodeId: 'nodeA', sourceSlot: 'ILink' }),
      makeEdge({ id: 'e2', targetNodeId: 'nodeA', targetSlot: 'data' })
    ]
    const result = getConnectedSlots('nodeA', edges)
    expect(result.has('ILink')).toBe(true)
    expect(result.has('data')).toBe(true)
    expect(result.size).toBe(2)
  })
})
