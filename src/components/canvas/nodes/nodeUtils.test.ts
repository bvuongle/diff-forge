import { makeEdge, makeNode, makeSlot } from '@testing/fixtures'
import { describe, expect, it } from 'vitest'

import { getConnectionCounts, getEdgeSourceMap, getPortDragState, getSlotTooltip, isNodeDimmed } from './nodeUtils'

describe('getConnectionCounts', () => {
  it('returns empty map when no edges', () => {
    expect(getConnectionCounts('nodeA', []).size).toBe(0)
  })

  it('returns source slot count for source node', () => {
    const result = getConnectionCounts('nodeA', [makeEdge('e1', 'nodeA', 'nodeB')])
    expect(result.get('ILink')).toBe(1)
  })

  it('returns target slot count for target node', () => {
    const result = getConnectionCounts('nodeB', [makeEdge('e1', 'nodeA', 'nodeB')])
    expect(result.get('transport')).toBe(1)
  })

  it('returns empty map for unrelated node', () => {
    expect(getConnectionCounts('nodeC', [makeEdge('e1', 'nodeA', 'nodeB')]).size).toBe(0)
  })

  it('collects counts from multiple edges', () => {
    const edges = [makeEdge('e1', 'nodeA', 'nodeB'), makeEdge('e2', 'nodeC', 'nodeA', { targetSlot: 'data' })]
    const result = getConnectionCounts('nodeA', edges)
    expect(result.get('ILink')).toBe(1)
    expect(result.get('data')).toBe(1)
  })

  it('counts multiple connections to same slot', () => {
    const edges = [makeEdge('e1', 'nodeA', 'nodeB'), makeEdge('e2', 'nodeC', 'nodeB')]
    expect(getConnectionCounts('nodeB', edges).get('transport')).toBe(2)
  })
})

describe('getPortDragState', () => {
  it('returns idle when dragInfo is null', () => {
    expect(getPortDragState(makeSlot(), 'n1', null)).toBe('idle')
  })
  it('returns dimmed when slot belongs to the dragging node', () => {
    expect(getPortDragState(makeSlot(), 'n1', { sourceNodeId: 'n1', sourceInterfaces: ['ILink'] })).toBe('dimmed')
  })
  it('returns dimmed for output slots', () => {
    expect(
      getPortDragState(makeSlot({ direction: 'out' }), 'n1', { sourceNodeId: 'other', sourceInterfaces: ['ILink'] })
    ).toBe('dimmed')
  })
  it('returns valid when slot interface matches source interfaces', () => {
    expect(
      getPortDragState(makeSlot({ interface: 'ILink' }), 'n1', {
        sourceNodeId: 'other',
        sourceInterfaces: ['ILink', 'IMonitor']
      })
    ).toBe('valid')
  })
  it('returns dimmed when slot interface does not match', () => {
    expect(
      getPortDragState(makeSlot({ interface: 'ILink' }), 'n1', {
        sourceNodeId: 'other',
        sourceInterfaces: ['IMonitor']
      })
    ).toBe('dimmed')
  })
})

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
    expect(getSlotTooltip({ transport: ['linkEth0', 'linkGsm0'] }, 'transport')).toBe('linkEth0, linkGsm0')
  })

  it('returns empty string for unrelated slot name', () => {
    expect(getSlotTooltip({ transport: ['linkEth0'] }, 'other')).toBe('')
  })
})

describe('getEdgeSourceMap', () => {
  it('returns empty map for node with no incoming edges', () => {
    expect(getEdgeSourceMap('n1', { nodes: [makeNode('n1')], edges: [] })).toEqual({})
  })

  it('maps target slot to source instanceIds', () => {
    const src = makeNode('src', { instanceId: 'linkEth0' })
    const tgt = makeNode('tgt')
    const edge = makeEdge('e1', 'src', 'tgt', { targetSlot: 'transport' })
    expect(getEdgeSourceMap('tgt', { nodes: [src, tgt], edges: [edge] })).toEqual({ transport: ['linkEth0'] })
  })

  it('groups multiple sources under the same slot', () => {
    const s1 = makeNode('s1', { instanceId: 'link0' })
    const s2 = makeNode('s2', { instanceId: 'link1' })
    const tgt = makeNode('tgt')
    const e1 = makeEdge('e1', 's1', 'tgt', { targetSlot: 'links' })
    const e2 = makeEdge('e2', 's2', 'tgt', { targetSlot: 'links' })
    expect(getEdgeSourceMap('tgt', { nodes: [s1, s2, tgt], edges: [e1, e2] }).links).toEqual(['link0', 'link1'])
  })

  it('ignores edges targeting other nodes', () => {
    const src = makeNode('src', { instanceId: 'link0' })
    const other = makeNode('other')
    const edge = makeEdge('e1', 'src', 'other')
    expect(getEdgeSourceMap('n1', { nodes: [src, other], edges: [edge] })).toEqual({})
  })
})

describe('isNodeDimmed', () => {
  it('returns false when nothing is selected', () => {
    expect(isNodeDimmed('a', new Set(), new Set(), [])).toBe(false)
  })

  it('returns false for the selected node itself', () => {
    expect(isNodeDimmed('a', new Set(['a']), new Set(), [])).toBe(false)
  })

  it('returns false for a neighbor of a selected node', () => {
    expect(isNodeDimmed('b', new Set(['a']), new Set(), [makeEdge('e1', 'a', 'b')])).toBe(false)
  })

  it('returns true for an unrelated node when a node is selected', () => {
    expect(isNodeDimmed('c', new Set(['a']), new Set(), [makeEdge('e1', 'a', 'b')])).toBe(true)
  })

  it('returns false for an endpoint of a selected edge', () => {
    expect(isNodeDimmed('a', new Set(), new Set(['e1']), [makeEdge('e1', 'a', 'b')])).toBe(false)
  })

  it('returns true for a node not on any selected edge', () => {
    expect(isNodeDimmed('c', new Set(), new Set(['e1']), [makeEdge('e1', 'a', 'b')])).toBe(true)
  })
})
