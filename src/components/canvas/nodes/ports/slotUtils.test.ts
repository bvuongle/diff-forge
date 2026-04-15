import { makeEdge, makeNode } from '@testing/fixtures'
import { describe, expect, it } from 'vitest'

import { getEdgeSourceMap, getSlotTooltip } from './slotUtils'

describe('getSlotTooltip', () => {
  it('returns empty string when slot has no sources', () => {
    expect(getSlotTooltip({}, 'transport')).toBe('')
  })

  it('returns empty string when sources array is empty', () => {
    expect(getSlotTooltip({ transport: [] }, 'transport')).toBe('')
  })

  it('returns single source name', () => {
    expect(getSlotTooltip({ transport: ['linkEth0'] }, 'transport')).toBe('linkEth0')
  })

  it('joins multiple sources with comma', () => {
    const map = { transport: ['linkEth0', 'linkGsm0'] }
    expect(getSlotTooltip(map, 'transport')).toBe('linkEth0, linkGsm0')
  })

  it('returns empty string for unrelated slot name', () => {
    const map = { transport: ['linkEth0'] }
    expect(getSlotTooltip(map, 'other')).toBe('')
  })
})

describe('getEdgeSourceMap', () => {
  it('returns empty map for node with no incoming edges', () => {
    const node = makeNode('n1')
    const result = getEdgeSourceMap('n1', { nodes: [node], edges: [] })
    expect(result).toEqual({})
  })

  it('maps target slot to source instanceIds', () => {
    const src = makeNode('src', { instanceId: 'linkEth0' })
    const tgt = makeNode('tgt')
    const edge = makeEdge('e1', 'src', 'tgt', { targetSlot: 'transport' })
    const result = getEdgeSourceMap('tgt', { nodes: [src, tgt], edges: [edge] })
    expect(result).toEqual({ transport: ['linkEth0'] })
  })

  it('groups multiple sources under the same slot', () => {
    const s1 = makeNode('s1', { instanceId: 'link0' })
    const s2 = makeNode('s2', { instanceId: 'link1' })
    const tgt = makeNode('tgt')
    const e1 = makeEdge('e1', 's1', 'tgt', { targetSlot: 'links' })
    const e2 = makeEdge('e2', 's2', 'tgt', { targetSlot: 'links' })
    const result = getEdgeSourceMap('tgt', { nodes: [s1, s2, tgt], edges: [e1, e2] })
    expect(result.links).toEqual(['link0', 'link1'])
  })

  it('ignores edges targeting other nodes', () => {
    const src = makeNode('src', { instanceId: 'link0' })
    const other = makeNode('other')
    const edge = makeEdge('e1', 'src', 'other')
    const result = getEdgeSourceMap('n1', { nodes: [src, other], edges: [edge] })
    expect(result).toEqual({})
  })
})
