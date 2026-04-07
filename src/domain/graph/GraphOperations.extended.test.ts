import { describe, it, expect } from 'vitest'
import {
  addNode,
  removeNode,
  addEdge,
  removeEdge,
  moveNode,
  updateNodeConfig,
  validateEdge
} from '@domain/graph/GraphOperations'
import type { Graph } from '@domain/graph/GraphTypes'
import { makeNode, makeEdge } from '@testing/fixtures'

function emptyGraph(): Graph {
  return { nodes: [], edges: [] }
}

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

describe('addNode — immutability', () => {
  it('preserves existing nodes by reference', () => {
    const n1 = makeNode('n1')
    const graph = addNode(emptyGraph(), n1)
    const result = addNode(graph, makeNode('n2'))
    expect(result.nodes[0]).toBe(n1)
  })

  it('preserves edges array reference (spread keeps same ref)', () => {
    const graph = emptyGraph()
    const result = addNode(graph, makeNode('n1'))
    expect(result.edges).toBe(graph.edges)
  })
})

describe('removeNode — edge cases', () => {
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

describe('addEdge — immutability', () => {
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

describe('removeEdge — edge cases', () => {
  it('returns graph unchanged if edgeId does not exist', () => {
    const graph = addEdge(emptyGraph(), makeEdge('e1', 'n1', 'n2'))
    const result = removeEdge(graph, 'nonexistent')
    expect(result.edges).toHaveLength(1)
  })
})

describe('moveNode — edge cases', () => {
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

describe('validateEdge', () => {
  it('rejects self-connections', () => {
    const graph = addNode(emptyGraph(), makeNode('n1', {
      slots: [
        { name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: 99 },
        { name: 'transport', interface: 'ILink', direction: 'in', maxConnections: 1 }
      ]
    }))
    const result = validateEdge(graph, 'n1', 'ILink', 'n1', 'transport')
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Self-connection')
  })

  it('rejects if source slot interface does not match target slot interface', () => {
    let graph = addNode(emptyGraph(), makeNode('n1', {
      slots: [{ name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: 99 }]
    }))
    graph = addNode(graph, makeNode('n2', {
      slots: [{ name: 'sensor', interface: 'ISensor', direction: 'in', maxConnections: 1 }]
    }))
    const result = validateEdge(graph, 'n1', 'ILink', 'n2', 'sensor')
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Interface mismatch')
  })

  it('rejects if target slot already at max connections', () => {
    let graph = addNode(emptyGraph(), makeNode('n1', {
      slots: [{ name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: 99 }]
    }))
    graph = addNode(graph, makeNode('n2', {
      slots: [{ name: 'transport', interface: 'ILink', direction: 'in', maxConnections: 1 }]
    }))
    graph = addNode(graph, makeNode('n3', {
      slots: [{ name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: 99 }]
    }))
    graph = addEdge(graph, makeEdge('e1', 'n1', 'n2'))
    const result = validateEdge(graph, 'n3', 'ILink', 'n2', 'transport')
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Max connections reached')
  })

  it('accepts valid connection', () => {
    let graph = addNode(emptyGraph(), makeNode('n1', {
      slots: [{ name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: 99 }]
    }))
    graph = addNode(graph, makeNode('n2', {
      slots: [{ name: 'transport', interface: 'ILink', direction: 'in', maxConnections: 1 }]
    }))
    const result = validateEdge(graph, 'n1', 'ILink', 'n2', 'transport')
    expect(result.valid).toBe(true)
  })
})
