import { describe, expect, it } from 'vitest'

import { makeEdge, makeNode } from '../../testing/fixtures'
import { Graph } from './GraphTypes'
import { detectCycles, detectOrphans, validateGraph } from './graphValidation'

describe('GraphValidation', () => {
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

  describe('detectOrphans', () => {
    it('returns all nodes as orphans in graph with no edges', () => {
      const nodes = [makeNode('A'), makeNode('B')]
      const graph: Graph = { nodes, edges: [] }
      expect(detectOrphans(graph)).toEqual(['A', 'B'])
    })

    it('returns empty array for fully connected graph', () => {
      const nodes = [makeNode('A'), makeNode('B')]
      const edges = [makeEdge('e1', 'A', 'B')]
      const graph: Graph = { nodes, edges }
      expect(detectOrphans(graph)).toEqual([])
    })

    it('detects disconnected node as orphan', () => {
      const nodes = [makeNode('A'), makeNode('B'), makeNode('C')]
      const edges = [makeEdge('e1', 'A', 'B')]
      const graph: Graph = { nodes, edges }
      expect(detectOrphans(graph)).toEqual(['C'])
    })
  })

  describe('validateGraph', () => {
    it('returns valid: true for a healthy graph', () => {
      const nodes = [
        makeNode('A', { slots: [{ name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: 1 }] }),
        makeNode('B', { slots: [{ name: 'transport', interface: 'ILink', direction: 'in', maxConnections: 1 }] })
      ]
      const edges = [makeEdge('e1', 'A', 'B', { sourceSlot: 'ILink', targetSlot: 'transport' })]
      const graph: Graph = { nodes, edges }
      const result = validateGraph(graph)
      expect(result.valid).toBe(true)
      expect(result.cycles).toEqual([])
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

    it('returns valid: false when invalid edge exists', () => {
      const nodes = [makeNode('A')] // Node B is missing
      const edges = [makeEdge('e1', 'A', 'B')]
      const graph: Graph = { nodes, edges }
      const result = validateGraph(graph)
      expect(result.valid).toBe(false)
      expect(result.invalidEdges).toEqual(['e1'])
    })
  })
})
