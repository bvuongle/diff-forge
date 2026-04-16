import { makeEdge } from '@testing/fixtures'
import { describe, expect, it } from 'vitest'

import { isEdgeDimmed, isNodeDimmed } from './selectionDimming'

describe('isNodeDimmed', () => {
  it('returns false when nothing is selected', () => {
    expect(isNodeDimmed('a', new Set(), new Set(), [])).toBe(false)
  })

  it('returns false for the selected node itself', () => {
    expect(isNodeDimmed('a', new Set(['a']), new Set(), [])).toBe(false)
  })

  it('returns false for a neighbor of a selected node', () => {
    const edges = [makeEdge('e1', 'a', 'b')]
    expect(isNodeDimmed('b', new Set(['a']), new Set(), edges)).toBe(false)
  })

  it('returns true for an unrelated node when a node is selected', () => {
    const edges = [makeEdge('e1', 'a', 'b')]
    expect(isNodeDimmed('c', new Set(['a']), new Set(), edges)).toBe(true)
  })

  it('returns false for an endpoint of a selected edge', () => {
    const edges = [makeEdge('e1', 'a', 'b')]
    expect(isNodeDimmed('a', new Set(), new Set(['e1']), edges)).toBe(false)
  })

  it('returns true for a node not on any selected edge', () => {
    const edges = [makeEdge('e1', 'a', 'b')]
    expect(isNodeDimmed('c', new Set(), new Set(['e1']), edges)).toBe(true)
  })
})

describe('isEdgeDimmed', () => {
  const edge = { id: 'e1', sourceNodeId: 'a', sourceSlot: 'out', targetNodeId: 'b', targetSlot: 'in' }

  it('returns false when nothing is selected', () => {
    expect(isEdgeDimmed(edge, 'e1', new Set(), new Set())).toBe(false)
  })

  it('returns false when a node endpoint is selected', () => {
    expect(isEdgeDimmed(edge, 'e1', new Set(['a']), new Set())).toBe(false)
  })

  it('returns true when an unrelated node is selected', () => {
    expect(isEdgeDimmed(edge, 'e1', new Set(['c']), new Set())).toBe(true)
  })

  it('returns false when the edge itself is selected', () => {
    expect(isEdgeDimmed(edge, 'e1', new Set(), new Set(['e1']))).toBe(false)
  })

  it('returns true when a different edge is selected', () => {
    expect(isEdgeDimmed(edge, 'e1', new Set(), new Set(['e2']))).toBe(true)
  })

  it('returns true with undefined edge when any node is selected', () => {
    expect(isEdgeDimmed(undefined, 'e1', new Set(['a']), new Set())).toBe(true)
  })
})
