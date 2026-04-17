import { describe, expect, it } from 'vitest'

import { isEdgeDimmed } from './edgeUtils'

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
