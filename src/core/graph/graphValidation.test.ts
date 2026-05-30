import { describe, expect, it } from 'vitest'

import { makeEdge, makeNode } from '@testing/fixtures'

import { Graph, Slot } from './GraphTypes'
import { detectCycles, detectUnfilledRequiredSlots, validateGraph } from './graphValidation'

const requiredInSlot = (name: string, type = 'ILink'): Slot => ({
  name,
  type,
  direction: 'in',
  isArray: false
})
const arrayInSlot = (name: string, type = 'ILink'): Slot => ({
  name,
  type,
  direction: 'in',
  isArray: true
})
const outSlot = (name: string, type = 'ILink'): Slot => ({
  name,
  type,
  direction: 'out',
  isArray: true
})

describe('detectCycles', () => {
  it('returns empty array for empty graph', () => {
    const graph: Graph = { nodes: [], edges: [] }
    expect(detectCycles(graph)).toEqual([])
  })

  it('returns empty array for graph without cycles (diamond)', () => {
    const nodes = [makeNode('A'), makeNode('B'), makeNode('C'), makeNode('D')]
    const edges = [
      makeEdge('e1', 'A', 'B'),
      makeEdge('e2', 'A', 'C'),
      makeEdge('e3', 'B', 'D'),
      makeEdge('e4', 'C', 'D')
    ]
    const graph: Graph = { nodes, edges }
    expect(detectCycles(graph)).toEqual([])
  })

  it('detects simple A→B→A cycle', () => {
    const nodes = [makeNode('A'), makeNode('B')]
    const edges = [makeEdge('e1', 'A', 'B'), makeEdge('e2', 'B', 'A')]
    const graph: Graph = { nodes, edges }
    const cycles = detectCycles(graph)
    expect(cycles).toHaveLength(1)
    expect(cycles[0]).toEqual(['B', 'A'])
  })

  it('detects 3-node cycle A→B→C→A', () => {
    const nodes = [makeNode('A'), makeNode('B'), makeNode('C')]
    const edges = [makeEdge('e1', 'A', 'B'), makeEdge('e2', 'B', 'C'), makeEdge('e3', 'C', 'A')]
    const graph: Graph = { nodes, edges }
    const cycles = detectCycles(graph)
    expect(cycles).toHaveLength(1)
    expect(cycles[0]).toEqual(['B', 'C', 'A'])
  })
})

describe('detectUnfilledRequiredSlots', () => {
  it('returns empty for graph with no in-slots', () => {
    const graph: Graph = { nodes: [makeNode('A')], edges: [] }
    expect(detectUnfilledRequiredSlots(graph)).toEqual([])
  })

  it('flags a required in-slot with zero edges', () => {
    const nodes = [makeNode('A', { slots: [requiredInSlot('link')] })]
    const graph: Graph = { nodes, edges: [] }
    expect(detectUnfilledRequiredSlots(graph)).toEqual([{ nodeId: 'A', instanceId: 'A', slotName: 'link' }])
  })

  it('does not flag a required in-slot that has an incoming edge', () => {
    const nodes = [makeNode('A', { slots: [outSlot('ILink')] }), makeNode('B', { slots: [requiredInSlot('link')] })]
    const edges = [makeEdge('e1', 'A', 'B', { sourceSlot: 'ILink', targetSlot: 'link' })]
    const graph: Graph = { nodes, edges }
    expect(detectUnfilledRequiredSlots(graph)).toEqual([])
  })

  it('does not flag an array in-slot with zero edges (0..N is allowed)', () => {
    const nodes = [makeNode('A', { slots: [arrayInSlot('backups')] })]
    const graph: Graph = { nodes, edges: [] }
    expect(detectUnfilledRequiredSlots(graph)).toEqual([])
  })

  it('does not flag out-slots even if unwired', () => {
    const nodes = [makeNode('A', { slots: [outSlot('ILink')] })]
    const graph: Graph = { nodes, edges: [] }
    expect(detectUnfilledRequiredSlots(graph)).toEqual([])
  })

  it('reports per-slot, not per-node — multiple unfilled slots on same node', () => {
    const nodes = [makeNode('A', { slots: [requiredInSlot('link'), requiredInSlot('source', 'IDataSource')] })]
    const graph: Graph = { nodes, edges: [] }
    expect(detectUnfilledRequiredSlots(graph)).toEqual([
      { nodeId: 'A', instanceId: 'A', slotName: 'link' },
      { nodeId: 'A', instanceId: 'A', slotName: 'source' }
    ])
  })

  it('uses instanceId distinct from id when set', () => {
    const nodes = [makeNode('node-uuid', { instanceId: 'messageSource0', slots: [requiredInSlot('link')] })]
    const graph: Graph = { nodes, edges: [] }
    expect(detectUnfilledRequiredSlots(graph)).toEqual([
      { nodeId: 'node-uuid', instanceId: 'messageSource0', slotName: 'link' }
    ])
  })
})

describe('validateGraph', () => {
  it('returns valid: true for a healthy graph', () => {
    const nodes = [makeNode('A', { slots: [outSlot('ILink')] }), makeNode('B', { slots: [requiredInSlot('link')] })]
    const edges = [makeEdge('e1', 'A', 'B', { sourceSlot: 'ILink', targetSlot: 'link' })]
    const graph: Graph = { nodes, edges }
    const result = validateGraph(graph)
    expect(result.valid).toBe(true)
    expect(result.cycles).toEqual([])
    expect(result.unfilled).toEqual([])
    expect(result.invalidEdges).toEqual([])
  })

  it('returns valid: false when cycle exists', () => {
    const nodes = [makeNode('A'), makeNode('B')]
    const edges = [makeEdge('e1', 'A', 'B'), makeEdge('e2', 'B', 'A')]
    const graph: Graph = { nodes, edges }
    const result = validateGraph(graph)
    expect(result.valid).toBe(false)
    expect(result.cycles).toHaveLength(1)
  })

  it('returns valid: false when a required slot is unfilled', () => {
    const nodes = [makeNode('A', { slots: [requiredInSlot('link')] })]
    const graph: Graph = { nodes, edges: [] }
    const result = validateGraph(graph)
    expect(result.valid).toBe(false)
    expect(result.unfilled).toEqual([{ nodeId: 'A', instanceId: 'A', slotName: 'link' }])
  })

  it('returns valid: false when invalid edge exists', () => {
    const nodes = [makeNode('A')]
    const edges = [makeEdge('e1', 'A', 'B')]
    const graph: Graph = { nodes, edges }
    const result = validateGraph(graph)
    expect(result.valid).toBe(false)
    expect(result.invalidEdges).toEqual(['e1'])
  })
})
