import { describe, expect, it } from 'vitest'

import {
  addEdge,
  addNode,
  isEdgeInvalid,
  moveNode,
  removeEdge,
  removeNode,
  renameNode,
  updateNodeConfig,
  validateEdge
} from '@domain/graph/GraphOperations'
import type { Graph, GraphEdge, Slot } from '@domain/graph/GraphTypes'
import { makeEdge, makeNode } from '@testing/fixtures'

function emptyGraph(): Graph {
  return { nodes: [], edges: [] }
}

describe('addNode', () => {
  it('adds a node to the graph', () => {
    const result = addNode(emptyGraph(), makeNode('n1'))
    expect(result.nodes).toHaveLength(1)
    expect(result.nodes[0].id).toBe('n1')
  })

  it('does not mutate original graph', () => {
    const original = emptyGraph()
    addNode(original, makeNode('n1'))
    expect(original.nodes).toHaveLength(0)
  })

  it('throws on duplicate node id', () => {
    const graph = addNode(emptyGraph(), makeNode('n1'))
    expect(() => addNode(graph, makeNode('n1'))).toThrow('already exists')
  })

  it('preserves existing nodes by reference', () => {
    const n1 = makeNode('n1')
    const graph = addNode(emptyGraph(), n1)
    const result = addNode(graph, makeNode('n2'))
    expect(result.nodes[0]).toBe(n1)
  })

  it('preserves edges array reference', () => {
    const graph = emptyGraph()
    const result = addNode(graph, makeNode('n1'))
    expect(result.edges).toBe(graph.edges)
  })
})

describe('removeNode', () => {
  it('removes the node', () => {
    const graph = addNode(emptyGraph(), makeNode('n1'))
    const result = removeNode(graph, 'n1')
    expect(result.nodes).toHaveLength(0)
  })

  it('cascades removal to connected edges', () => {
    let graph = addNode(emptyGraph(), makeNode('n1'))
    graph = addNode(graph, makeNode('n2'))
    graph = addEdge(graph, makeEdge('e1', 'n1', 'n2'))
    const result = removeNode(graph, 'n1')
    expect(result.edges).toHaveLength(0)
    expect(result.nodes).toHaveLength(1)
  })

  it('returns graph unchanged if nodeId does not exist', () => {
    const graph = addNode(emptyGraph(), makeNode('n1'))
    const result = removeNode(graph, 'nonexistent')
    expect(result.nodes).toHaveLength(1)
  })

  it('removes edges where node is target', () => {
    let graph = addNode(emptyGraph(), makeNode('n1'))
    graph = addNode(graph, makeNode('n2'))
    graph = addEdge(graph, makeEdge('e1', 'n2', 'n1'))
    const result = removeNode(graph, 'n1')
    expect(result.edges).toHaveLength(0)
  })

  it('keeps edges between other nodes intact', () => {
    let graph = addNode(emptyGraph(), makeNode('n1'))
    graph = addNode(graph, makeNode('n2'))
    graph = addNode(graph, makeNode('n3'))
    graph = addEdge(graph, makeEdge('e1', 'n1', 'n2'))
    graph = addEdge(graph, makeEdge('e2', 'n2', 'n3'))
    const result = removeNode(graph, 'n1')
    expect(result.edges).toHaveLength(1)
    expect(result.edges[0].id).toBe('e2')
  })
})

describe('addEdge', () => {
  it('adds an edge to the graph', () => {
    const result = addEdge(emptyGraph(), makeEdge('e1', 'n1', 'n2'))
    expect(result.edges).toHaveLength(1)
    expect(result.edges[0].id).toBe('e1')
  })

  it('throws on duplicate edge id', () => {
    const graph = addEdge(emptyGraph(), makeEdge('e1', 'n1', 'n2'))
    expect(() => addEdge(graph, makeEdge('e1', 'n1', 'n2'))).toThrow('already exists')
  })

  it('does not mutate original graph edges', () => {
    const graph = emptyGraph()
    addEdge(graph, makeEdge('e1', 'n1', 'n2'))
    expect(graph.edges).toHaveLength(0)
  })

  it('preserves existing edges by reference', () => {
    const e1 = makeEdge('e1', 'n1', 'n2')
    const graph = addEdge(emptyGraph(), e1)
    const result = addEdge(graph, makeEdge('e2', 'n2', 'n3'))
    expect(result.edges[0]).toBe(e1)
  })
})

describe('removeEdge', () => {
  it('removes the edge', () => {
    const graph = addEdge(emptyGraph(), makeEdge('e1', 'n1', 'n2'))
    const result = removeEdge(graph, 'e1')
    expect(result.edges).toHaveLength(0)
  })

  it('leaves other edges intact', () => {
    let graph = addEdge(emptyGraph(), makeEdge('e1', 'n1', 'n2'))
    graph = addEdge(graph, makeEdge('e2', 'n2', 'n3'))
    const result = removeEdge(graph, 'e1')
    expect(result.edges).toHaveLength(1)
    expect(result.edges[0].id).toBe('e2')
  })

  it('returns graph unchanged if edgeId does not exist', () => {
    const graph = addEdge(emptyGraph(), makeEdge('e1', 'n1', 'n2'))
    const result = removeEdge(graph, 'nonexistent')
    expect(result.edges).toHaveLength(1)
  })
})

describe('moveNode', () => {
  it('updates node position', () => {
    const graph = addNode(emptyGraph(), makeNode('n1'))
    const result = moveNode(graph, 'n1', { x: 50, y: 75 })
    expect(result.nodes[0].position).toEqual({ x: 50, y: 75 })
  })

  it('does not affect other nodes', () => {
    let graph = addNode(emptyGraph(), makeNode('n1'))
    graph = addNode(graph, makeNode('n2'))
    const result = moveNode(graph, 'n1', { x: 50, y: 75 })
    expect(result.nodes[1].position).toEqual({ x: 0, y: 0 })
  })

  it('returns graph unchanged if nodeId does not exist', () => {
    const graph = addNode(emptyGraph(), makeNode('n1'))
    const result = moveNode(graph, 'nonexistent', { x: 100, y: 100 })
    expect(result.nodes[0].position).toEqual({ x: 0, y: 0 })
  })

  it('does not mutate original graph', () => {
    const graph = addNode(emptyGraph(), makeNode('n1'))
    moveNode(graph, 'n1', { x: 50, y: 75 })
    expect(graph.nodes[0].position).toEqual({ x: 0, y: 0 })
  })
})

describe('updateNodeConfig', () => {
  it('replaces config on the target node', () => {
    const graph = addNode(emptyGraph(), makeNode('n1'))
    const result = updateNodeConfig(graph, 'n1', { count: 5 })
    expect(result.nodes[0].config).toEqual({ count: 5 })
  })

  it('does not affect other nodes', () => {
    let graph = addNode(emptyGraph(), makeNode('n1'))
    graph = addNode(graph, makeNode('n2', { config: { existing: true } }))
    const result = updateNodeConfig(graph, 'n1', { count: 5 })
    expect(result.nodes[1].config).toEqual({ existing: true })
  })

  it('does not mutate original graph', () => {
    const graph = addNode(emptyGraph(), makeNode('n1'))
    const result = updateNodeConfig(graph, 'n1', { key: 'value' })
    expect(graph.nodes[0].config).toEqual({})
    expect(result.nodes[0].config).toEqual({ key: 'value' })
  })

  it('leaves node unchanged if nodeId not found', () => {
    const graph = addNode(emptyGraph(), makeNode('n1'))
    const result = updateNodeConfig(graph, 'nonexistent', { key: 'value' })
    expect(result.nodes[0].config).toEqual({})
  })
})

describe('validateEdge', () => {
  const srcSlot: Slot = { name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: Infinity }
  const tgtSlot: Slot = { name: 'transport', interface: 'ILink', direction: 'in', maxConnections: 1 }

  const graph: Graph = {
    nodes: [makeNode('a', { slots: [srcSlot] }), makeNode('b', { slots: [tgtSlot] })],
    edges: []
  }

  it('accepts valid connection', () => {
    const result = validateEdge(graph, 'a', 'ILink', 'b', 'transport')
    expect(result.valid).toBe(true)
  })

  it('allows connection when target slot below max connections', () => {
    const multiSlotGraph: Graph = {
      nodes: [makeNode('a', { slots: [srcSlot] }), makeNode('b', { slots: [{ ...tgtSlot, maxConnections: 3 }] })],
      edges: [makeEdge('e1', 'a', 'b')]
    }
    const result = validateEdge(multiSlotGraph, 'a', 'ILink', 'b', 'transport')
    expect(result.valid).toBe(true)
  })

  it('rejects self-connections', () => {
    const selfGraph = addNode(
      emptyGraph(),
      makeNode('n1', {
        slots: [
          { name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: 99 },
          { name: 'transport', interface: 'ILink', direction: 'in', maxConnections: 1 }
        ]
      })
    )
    const result = validateEdge(selfGraph, 'n1', 'ILink', 'n1', 'transport')
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

  it('returns true when source and target slot interfaces do not match', () => {
    const nodes = [
      makeNode('a', {
        slots: [{ name: 'IProcessable', interface: 'IProcessable', direction: 'out', maxConnections: Infinity }]
      }),
      makeNode('b', { slots: [{ name: 'routable', interface: 'IRoutable', direction: 'in', maxConnections: 1 }] })
    ]
    const edge: GraphEdge = {
      id: 'e1',
      sourceNodeId: 'a',
      sourceSlot: 'IProcessable',
      targetNodeId: 'b',
      targetSlot: 'routable'
    }
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
