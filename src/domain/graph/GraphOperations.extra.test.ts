import { describe, it, expect } from 'vitest'
import {
  validateEdge,
  renameNode,
  updateNodeVersion,
  isEdgeInvalid
} from '@domain/graph/GraphOperations'
import type { Graph, Slot } from '@domain/graph/GraphTypes'
import { makeNode, makeEdge } from '@testing/fixtures'

describe('validateEdge', () => {
  const srcSlot: Slot = { name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: Infinity }
  const tgtSlot: Slot = { name: 'transport', interface: 'ILink', direction: 'in', maxConnections: 1 }

  const graph: Graph = {
    nodes: [
      makeNode('a', { slots: [srcSlot] }),
      makeNode('b', { slots: [tgtSlot] })
    ],
    edges: []
  }

  it('returns valid for compatible slots', () => {
    const result = validateEdge(graph, 'a', 'ILink', 'b', 'transport')
    expect(result.valid).toBe(true)
  })

  it('rejects self-connections', () => {
    const result = validateEdge(graph, 'a', 'ILink', 'a', 'transport')
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Self-connection')
  })

  it('rejects when source node not found', () => {
    const result = validateEdge(graph, 'missing', 'ILink', 'b', 'transport')
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Node not found')
  })

  it('rejects when target node not found', () => {
    const result = validateEdge(graph, 'a', 'ILink', 'missing', 'transport')
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Node not found')
  })

  it('rejects when source slot not found', () => {
    const result = validateEdge(graph, 'a', 'badSlot', 'b', 'transport')
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Slot not found')
  })

  it('rejects when target slot not found', () => {
    const result = validateEdge(graph, 'a', 'ILink', 'b', 'badSlot')
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Slot not found')
  })

  it('rejects interface mismatch', () => {
    const mismatchGraph: Graph = {
      nodes: [
        makeNode('a', { slots: [{ name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: Infinity }] }),
        makeNode('b', { slots: [{ name: 'data', interface: 'IData', direction: 'in', maxConnections: 1 }] })
      ],
      edges: []
    }
    const result = validateEdge(mismatchGraph, 'a', 'ILink', 'b', 'data')
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Interface mismatch')
  })

  it('rejects when target slot at max connections', () => {
    const fullGraph: Graph = {
      ...graph,
      edges: [makeEdge('e1', 'a', 'b')]
    }
    const result = validateEdge(fullGraph, 'a', 'ILink', 'b', 'transport')
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Max connections reached')
  })

  it('allows connection when target slot below max connections', () => {
    const multiSlotGraph: Graph = {
      nodes: [
        makeNode('a', { slots: [srcSlot] }),
        makeNode('b', { slots: [{ ...tgtSlot, maxConnections: 3 }] })
      ],
      edges: [makeEdge('e1', 'a', 'b')]
    }
    const result = validateEdge(multiSlotGraph, 'a', 'ILink', 'b', 'transport')
    expect(result.valid).toBe(true)
  })
})

describe('isEdgeInvalid', () => {
  it('returns false for valid edge with matching slots', () => {
    const nodes = [
      makeNode('a', { slots: [{ name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: Infinity }] }),
      makeNode('b', { slots: [{ name: 'transport', interface: 'ILink', direction: 'in', maxConnections: 1 }] })
    ]
    const edge = makeEdge('e1', 'a', 'b')
    expect(isEdgeInvalid(edge, nodes)).toBe(false)
  })

  it('returns true when source node missing', () => {
    const nodes = [
      makeNode('b', { slots: [{ name: 'transport', interface: 'ILink', direction: 'in', maxConnections: 1 }] })
    ]
    const edge = makeEdge('e1', 'a', 'b')
    expect(isEdgeInvalid(edge, nodes)).toBe(true)
  })

  it('returns true when target node missing', () => {
    const nodes = [
      makeNode('a', { slots: [{ name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: Infinity }] })
    ]
    const edge = makeEdge('e1', 'a', 'b')
    expect(isEdgeInvalid(edge, nodes)).toBe(true)
  })

  it('returns true when source slot not found on source node', () => {
    const nodes = [
      makeNode('a', { slots: [{ name: 'other', interface: 'ILink', direction: 'out', maxConnections: Infinity }] }),
      makeNode('b', { slots: [{ name: 'transport', interface: 'ILink', direction: 'in', maxConnections: 1 }] })
    ]
    const edge = makeEdge('e1', 'a', 'b')
    expect(isEdgeInvalid(edge, nodes)).toBe(true)
  })

  it('returns true when target slot not found on target node', () => {
    const nodes = [
      makeNode('a', { slots: [{ name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: Infinity }] }),
      makeNode('b', { slots: [{ name: 'other', interface: 'ILink', direction: 'in', maxConnections: 1 }] })
    ]
    const edge = makeEdge('e1', 'a', 'b')
    expect(isEdgeInvalid(edge, nodes)).toBe(true)
  })

  it('returns true when source slot direction is not out', () => {
    const nodes = [
      makeNode('a', { slots: [{ name: 'ILink', interface: 'ILink', direction: 'in', maxConnections: 1 }] }),
      makeNode('b', { slots: [{ name: 'transport', interface: 'ILink', direction: 'in', maxConnections: 1 }] })
    ]
    const edge = makeEdge('e1', 'a', 'b')
    expect(isEdgeInvalid(edge, nodes)).toBe(true)
  })
})

describe('renameNode', () => {
  it('renames the node id and instanceId', () => {
    const graph: Graph = { nodes: [makeNode('old')], edges: [] }
    const result = renameNode(graph, 'old', 'new')
    expect(result.nodes[0].id).toBe('new')
    expect(result.nodes[0].instanceId).toBe('new')
  })

  it('updates edge references to renamed node', () => {
    const graph: Graph = {
      nodes: [makeNode('a'), makeNode('b')],
      edges: [makeEdge('e1', 'a', 'b')]
    }
    const result = renameNode(graph, 'a', 'x')
    expect(result.edges[0].sourceNodeId).toBe('x')
    expect(result.edges[0].targetNodeId).toBe('b')
  })

  it('updates target edge references too', () => {
    const graph: Graph = {
      nodes: [makeNode('a'), makeNode('b')],
      edges: [makeEdge('e1', 'a', 'b')]
    }
    const result = renameNode(graph, 'b', 'y')
    expect(result.edges[0].sourceNodeId).toBe('a')
    expect(result.edges[0].targetNodeId).toBe('y')
  })

  it('returns same graph if old === new', () => {
    const graph: Graph = { nodes: [makeNode('a')], edges: [] }
    const result = renameNode(graph, 'a', 'a')
    expect(result).toBe(graph)
  })

  it('throws on empty new id', () => {
    const graph: Graph = { nodes: [makeNode('a')], edges: [] }
    expect(() => renameNode(graph, 'a', '')).toThrow('cannot be empty')
  })

  it('throws on whitespace-only new id', () => {
    const graph: Graph = { nodes: [makeNode('a')], edges: [] }
    expect(() => renameNode(graph, 'a', '   ')).toThrow('cannot be empty')
  })

  it('throws if new id already exists', () => {
    const graph: Graph = { nodes: [makeNode('a'), makeNode('b')], edges: [] }
    expect(() => renameNode(graph, 'a', 'b')).toThrow('already exists')
  })
})

describe('updateNodeVersion', () => {
  it('updates version and slots', () => {
    const graph: Graph = { nodes: [makeNode('a', { version: '1.0.0' })], edges: [] }
    const newSlots: Slot[] = [{ name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: Infinity }]
    const result = updateNodeVersion(graph, 'a', '2.0.0', newSlots, {})
    expect(result.nodes[0].version).toBe('2.0.0')
    expect(result.nodes[0].slots).toEqual(newSlots)
  })

  it('migrates config keys that exist in new schema', () => {
    const graph: Graph = {
      nodes: [makeNode('a', { config: { keep: 1, drop: 2 } })],
      edges: []
    }
    const newSchema = { keep: { type: 'uint' }, added: { type: 'string' } }
    const result = updateNodeVersion(graph, 'a', '2.0.0', [], newSchema)
    expect(result.nodes[0].config).toEqual({ keep: 1 })
  })

  it('does not affect other nodes', () => {
    const graph: Graph = {
      nodes: [makeNode('a', { version: '1.0.0' }), makeNode('b', { version: '1.0.0' })],
      edges: []
    }
    const result = updateNodeVersion(graph, 'a', '2.0.0', [], {})
    expect(result.nodes[1].version).toBe('1.0.0')
  })
})
