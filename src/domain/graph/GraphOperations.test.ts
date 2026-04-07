import { describe, it, expect } from 'vitest'
import { addNode, removeNode, addEdge, removeEdge, moveNode } from '@domain/graph/GraphOperations'
import type { Graph } from '@domain/graph/GraphTypes'
import { makeNode, makeEdge } from '@testing/fixtures'

function emptyGraph(): Graph {
  return { nodes: [], edges: [] }
}

describe('addNode', () => {
  it('adds a node to the graph', () => {
    const result = addNode(emptyGraph(), makeNode('n1'))
    expect(result.nodes).toHaveLength(1)
    expect(result.nodes[0].id).toBe('n1')
  })

  it('throws on duplicate node id', () => {
    const graph = addNode(emptyGraph(), makeNode('n1'))
    expect(() => addNode(graph, makeNode('n1'))).toThrow('already exists')
  })

  it('does not mutate original graph', () => {
    const original = emptyGraph()
    addNode(original, makeNode('n1'))
    expect(original.nodes).toHaveLength(0)
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
})
