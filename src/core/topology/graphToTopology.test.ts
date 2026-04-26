import { describe, expect, it } from 'vitest'

import { makeEdge, makeNode } from '@testing/fixtures'

import { graphToTopology } from './graphToTopology'

describe('graphToTopology', () => {
  it('returns empty array for empty graph', () => {
    const result = graphToTopology({ nodes: [], edges: [] })
    expect(result).toEqual([])
  })

  it('returns entry with empty dependencies for isolated node', () => {
    const node = makeNode('n1', { componentType: 'LinkEth', instanceId: 'linkEth0', config: { port: 8080 } })
    const result = graphToTopology({ nodes: [node], edges: [] })
    expect(result).toEqual([
      {
        type: 'LinkEth',
        id: 'linkEth0',
        version: '1.0.0',
        source: 'diff_broker',
        dependencies: [],
        config: { port: 8080 }
      }
    ])
  })

  it('emits version and source from node metadata', () => {
    const node = makeNode('n1', { instanceId: 'linkEth0', version: '2.3.1', source: 'my_source' })
    const result = graphToTopology({ nodes: [node], edges: [] })
    expect(result[0].version).toBe('2.3.1')
    expect(result[0].source).toBe('my_source')
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

  it('emits leaves before consumers (topological BFS order)', () => {
    const msg = makeNode('msg', { instanceId: 'messageSource0', componentType: 'MessageSource' })
    const link1 = makeNode('l1', { instanceId: 'linkEth0', componentType: 'LinkEth' })
    const link2 = makeNode('l2', { instanceId: 'linkGsm0', componentType: 'LinkGsm' })
    const e1 = makeEdge('e1', 'l1', 'msg')
    const e2 = makeEdge('e2', 'l2', 'msg')
    const result = graphToTopology({ nodes: [msg, link1, link2], edges: [e1, e2] })

    const idsInOrder = result.map((e) => e.id)
    expect(idsInOrder.indexOf('linkEth0')).toBeLessThan(idsInOrder.indexOf('messageSource0'))
    expect(idsInOrder.indexOf('linkGsm0')).toBeLessThan(idsInOrder.indexOf('messageSource0'))
  })

  it('emits in layers: indegree-0 first, then indegree-1, etc.', () => {
    const a = makeNode('a', { instanceId: 'a0' })
    const b = makeNode('b', { instanceId: 'b0' })
    const c = makeNode('c', { instanceId: 'c0' })
    const result = graphToTopology({
      nodes: [c, b, a],
      edges: [makeEdge('e1', 'a', 'b'), makeEdge('e2', 'b', 'c')]
    })
    expect(result.map((e) => e.id)).toEqual(['a0', 'b0', 'c0'])
  })

  it('orders dependencies by target slot position regardless of edge insertion order', () => {
    const routerSlots = [
      { name: 'IRoutable', interface: 'IRoutable', direction: 'out' as const, maxConnections: Infinity },
      { name: 'routable', interface: 'IRoutable', direction: 'in' as const, maxConnections: 1 },
      { name: 'processable', interface: 'IProcessable', direction: 'in' as const, maxConnections: 1 }
    ]
    const router = makeNode('r', { instanceId: 'router0', componentType: 'Router' })
    const msg = makeNode('m', { instanceId: 'messageSource0', componentType: 'MessageSource' })
    const dispatcher = makeNode('d', { instanceId: 'dispatcher0', componentType: 'Dispatcher', slots: routerSlots })
    const eProcessable = makeEdge('e1', 'm', 'd', { targetSlot: 'processable' })
    const eRoutable = makeEdge('e2', 'r', 'd', { targetSlot: 'routable' })
    const result = graphToTopology({ nodes: [router, msg, dispatcher], edges: [eProcessable, eRoutable] })
    const dispatcherEntry = result.find((e) => e.id === 'dispatcher0')!
    expect(dispatcherEntry.dependencies).toEqual(['router0', 'messageSource0'])
  })

  it('falls back to insertion order when cycles are present', () => {
    const a = makeNode('a', { instanceId: 'a0' })
    const b = makeNode('b', { instanceId: 'b0' })
    const result = graphToTopology({
      nodes: [a, b],
      edges: [makeEdge('e1', 'a', 'b'), makeEdge('e2', 'b', 'a')]
    })
    expect(result.map((e) => e.id).sort()).toEqual(['a0', 'b0'])
  })
})
