import { makeEdge, makeNode } from '@testing/fixtures'
import { describe, expect, it } from 'vitest'

import { graphToTopology, topologyToGraph } from './TopologyMapper'

describe('graphToTopology', () => {
  it('returns empty array for empty graph', () => {
    const result = graphToTopology({ nodes: [], edges: [] })
    expect(result).toEqual([])
  })

  it('returns entry with empty dependencies for isolated node', () => {
    const node = makeNode('n1', { componentType: 'LinkEth', instanceId: 'linkEth0', config: { port: 8080 } })
    const result = graphToTopology({ nodes: [node], edges: [] })
    expect(result).toEqual([{ type: 'LinkEth', id: 'linkEth0', dependencies: [], config: { port: 8080 } }])
  })

  it('maps edges to dependencies using source instanceId', () => {
    const src = makeNode('src', { instanceId: 'linkEth0' })
    const tgt = makeNode('tgt', { instanceId: 'messageSource0', componentType: 'MessageSource' })
    const edge = makeEdge('e1', 'src', 'tgt')
    const result = graphToTopology({ nodes: [src, tgt], edges: [edge] })

    const tgtEntry = result.find((e) => e.id === 'messageSource0')
    expect(tgtEntry?.dependencies).toEqual(['linkEth0'])
  })

  it('collects multiple dependencies for a single node', () => {
    const link1 = makeNode('l1', { instanceId: 'linkEth0' })
    const link2 = makeNode('l2', { instanceId: 'linkGsm0' })
    const msg = makeNode('msg', { instanceId: 'messageSource0' })
    const e1 = makeEdge('e1', 'l1', 'msg', { targetSlot: 'link' })
    const e2 = makeEdge('e2', 'l2', 'msg', { targetSlot: 'backupLink' })
    const result = graphToTopology({ nodes: [link1, link2, msg], edges: [e1, e2] })

    const msgEntry = result.find((e) => e.id === 'messageSource0')
    expect(msgEntry?.dependencies).toContain('linkEth0')
    expect(msgEntry?.dependencies).toContain('linkGsm0')
    expect(msgEntry?.dependencies).toHaveLength(2)
  })

  it('ignores edges with missing source node', () => {
    const tgt = makeNode('tgt', { instanceId: 'tgt0' })
    const edge = makeEdge('e1', 'missing', 'tgt')
    const result = graphToTopology({ nodes: [tgt], edges: [edge] })
    expect(result[0].dependencies).toEqual([])
  })

  it('passes config through', () => {
    const node = makeNode('n1', { config: { count: 3, content: 'hello' } })
    const result = graphToTopology({ nodes: [node], edges: [] })
    expect(result[0].config).toEqual({ count: 3, content: 'hello' })
  })
})

describe('topologyToGraph', () => {
  it('creates nodes from topology entries', () => {
    const topology = [
      { type: 'LinkEth', id: 'linkEth0', dependencies: [], config: {} },
      { type: 'MessageSource', id: 'msg0', dependencies: ['linkEth0'], config: { count: 5 } }
    ]
    const graph = topologyToGraph(topology)
    expect(graph.nodes).toHaveLength(2)
    expect(graph.nodes[0].instanceId).toBe('linkEth0')
    expect(graph.nodes[1].config).toEqual({ count: 5 })
  })

  it('creates edges from dependencies', () => {
    const topology = [
      { type: 'LinkEth', id: 'linkEth0', dependencies: [], config: {} },
      { type: 'MessageSource', id: 'msg0', dependencies: ['linkEth0'], config: {} }
    ]
    const graph = topologyToGraph(topology)
    expect(graph.edges).toHaveLength(1)
    expect(graph.edges[0].sourceNodeId).toBe('linkEth0')
    expect(graph.edges[0].targetNodeId).toBe('msg0')
  })

  it('spaces nodes horizontally', () => {
    const topology = [
      { type: 'A', id: 'a', dependencies: [], config: {} },
      { type: 'B', id: 'b', dependencies: [], config: {} }
    ]
    const graph = topologyToGraph(topology)
    expect(graph.nodes[0].position.x).toBe(0)
    expect(graph.nodes[1].position.x).toBe(200)
  })

  it('returns empty graph for empty topology', () => {
    const graph = topologyToGraph([])
    expect(graph.nodes).toEqual([])
    expect(graph.edges).toEqual([])
  })
})
