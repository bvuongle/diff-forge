import { describe, expect, it } from 'vitest'

import { Topology } from '@domain/topology/TopologyTypes'
import { makeCatalog } from '@testing/fixtures'

import { topologyToGraph } from './topologyToGraph'

describe('topologyToGraph', () => {
  const linkEthCatalog = makeCatalog({
    type: 'LinkEth',
    implements: ['ILink'],
    requires: []
  })
  const msgCatalog = makeCatalog({
    type: 'MessageSource',
    implements: [],
    requires: [{ slot: 'transport', interface: 'ILink', min: 1, max: 1, order: 0 }]
  })

  it('builds nodes with slots from catalog', () => {
    const topology: Topology = [
      {
        type: 'LinkEth',
        id: 'linkEth0',
        version: '1.0.0',
        source: 'diff_broker',
        dependencies: [],
        config: {}
      }
    ]
    const { graph, unresolved } = topologyToGraph(topology, [linkEthCatalog])
    expect(unresolved).toEqual([])
    expect(graph.nodes[0].slots).toHaveLength(1)
    expect(graph.nodes[0].slots[0].direction).toBe('out')
  })

  it('marks unresolved when catalog entry missing', () => {
    const topology: Topology = [
      {
        type: 'Unknown',
        id: 'unknown0',
        version: '1.0.0',
        source: 'diff_broker',
        dependencies: [],
        config: {}
      }
    ]
    const { graph, unresolved } = topologyToGraph(topology, [])
    expect(unresolved).toEqual(['unknown0'])
    expect(graph.nodes[0].slots).toEqual([])
  })

  it('matches catalog by version', () => {
    const v1 = makeCatalog({ type: 'LinkEth', version: '1.0.0', implements: ['ILinkV1'], requires: [] })
    const v2 = makeCatalog({ type: 'LinkEth', version: '2.0.0', implements: ['ILinkV2'], requires: [] })
    const topology: Topology = [
      {
        type: 'LinkEth',
        id: 'linkEth0',
        version: '2.0.0',
        source: 'diff_broker',
        dependencies: [],
        config: {}
      }
    ]
    const { graph, unresolved } = topologyToGraph(topology, [v1, v2])
    expect(unresolved).toEqual([])
    expect(graph.nodes[0].slots[0].interface).toBe('ILinkV2')
  })

  it('synthesizes positions via layoutByLevels — leaves in column 0, consumers to the right', () => {
    const topology: Topology = [
      { type: 'LinkEth', id: 'linkEth0', version: '1.0.0', source: 'diff_broker', dependencies: [], config: {} },
      {
        type: 'MessageSource',
        id: 'msg0',
        version: '1.0.0',
        source: 'diff_broker',
        dependencies: ['linkEth0'],
        config: {}
      }
    ]
    const { graph } = topologyToGraph(topology, [linkEthCatalog, msgCatalog])
    const link = graph.nodes.find((n) => n.id === 'linkEth0')!
    const msg = graph.nodes.find((n) => n.id === 'msg0')!
    expect(link.position.x).toBe(0)
    expect(msg.position.x).toBeGreaterThan(link.position.x)
  })

  it('builds edges with correct source and target slots', () => {
    const topology: Topology = [
      {
        type: 'LinkEth',
        id: 'linkEth0',
        version: '1.0.0',
        source: 'diff_broker',
        dependencies: [],
        config: {}
      },
      {
        type: 'MessageSource',
        id: 'msg0',
        version: '1.0.0',
        source: 'diff_broker',
        dependencies: ['linkEth0'],
        config: {}
      }
    ]
    const { graph } = topologyToGraph(topology, [linkEthCatalog, msgCatalog])
    expect(graph.edges).toHaveLength(1)
    expect(graph.edges[0].sourceNodeId).toBe('linkEth0')
    expect(graph.edges[0].targetNodeId).toBe('msg0')
    expect(graph.edges[0].sourceSlot).toBe('ILink')
    expect(graph.edges[0].targetSlot).toBe('transport')
  })

  it('fills a max>1 slot with all matching deps instead of spilling to undefined slots', () => {
    const linkSatCatalog = makeCatalog({ type: 'LinkSat', implements: ['ILink'], requires: [] })
    const routerCatalog = makeCatalog({
      type: 'Router',
      implements: ['IRoutable'],
      requires: [{ slot: 'links', interface: 'ILink', min: 1, max: 8, order: 0 }]
    })
    const topology: Topology = [
      { type: 'LinkSat', id: 'linkSat0', version: '1.0.0', source: 'diff_broker', dependencies: [], config: {} },
      { type: 'LinkSat', id: 'linkSat1', version: '1.0.0', source: 'diff_broker', dependencies: [], config: {} },
      { type: 'LinkSat', id: 'linkSat2', version: '1.0.0', source: 'diff_broker', dependencies: [], config: {} },
      {
        type: 'Router',
        id: 'router0',
        version: '1.0.0',
        source: 'diff_broker',
        dependencies: ['linkSat0', 'linkSat1', 'linkSat2'],
        config: {}
      }
    ]
    const { graph } = topologyToGraph(topology, [linkSatCatalog, routerCatalog])
    const routerEdges = graph.edges.filter((e) => e.targetNodeId === 'router0')
    expect(routerEdges).toHaveLength(3)
    for (const e of routerEdges) {
      expect(e.targetSlot).toBe('links')
      expect(e.sourceSlot).toBe('ILink')
    }
  })

  it('routes deps to the slot whose interface they implement, preserving C++ flat-order semantics', () => {
    const msgCat = makeCatalog({ type: 'MessageSource', implements: ['IProcessable'], requires: [] })
    const routerCat = makeCatalog({ type: 'Router', implements: ['IRoutable'], requires: [] })
    const dispatcherCat = makeCatalog({
      type: 'Dispatcher',
      implements: [],
      requires: [
        { slot: 'routable', interface: 'IRoutable', min: 1, max: 1, order: 0 },
        { slot: 'processable', interface: 'IProcessable', min: 1, max: 1, order: 1 }
      ]
    })
    const topology: Topology = [
      {
        type: 'MessageSource',
        id: 'messageSource0',
        version: '1.0.0',
        source: 'diff_broker',
        dependencies: [],
        config: {}
      },
      { type: 'Router', id: 'router0', version: '1.0.0', source: 'diff_broker', dependencies: [], config: {} },
      {
        type: 'Dispatcher',
        id: 'dispatcher0',
        version: '1.0.0',
        source: 'diff_broker',
        dependencies: ['router0', 'messageSource0'],
        config: {}
      }
    ]
    const { graph } = topologyToGraph(topology, [msgCat, routerCat, dispatcherCat])
    const edges = graph.edges.filter((e) => e.targetNodeId === 'dispatcher0')
    expect(edges).toHaveLength(2)
    const routable = edges.find((e) => e.targetSlot === 'routable')!
    const processable = edges.find((e) => e.targetSlot === 'processable')!
    expect(routable.sourceNodeId).toBe('router0')
    expect(routable.sourceSlot).toBe('IRoutable')
    expect(processable.sourceNodeId).toBe('messageSource0')
    expect(processable.sourceSlot).toBe('IProcessable')
  })

  it('skips edges when target catalog is missing', () => {
    const topology: Topology = [
      { type: 'LinkEth', id: 'linkEth0', version: '1.0.0', source: 'diff_broker', dependencies: [], config: {} },
      {
        type: 'Unknown',
        id: 'unknown0',
        version: '1.0.0',
        source: 'diff_broker',
        dependencies: ['linkEth0'],
        config: {}
      }
    ]
    const { graph, unresolved } = topologyToGraph(topology, [linkEthCatalog])
    expect(unresolved).toEqual(['unknown0'])
    expect(graph.edges).toEqual([])
  })

  it('skips edges when source catalog is missing', () => {
    const topology: Topology = [
      { type: 'Unknown', id: 'unknown0', version: '1.0.0', source: 'diff_broker', dependencies: [], config: {} },
      {
        type: 'MessageSource',
        id: 'msg0',
        version: '1.0.0',
        source: 'diff_broker',
        dependencies: ['unknown0'],
        config: {}
      }
    ]
    const { graph, unresolved } = topologyToGraph(topology, [msgCatalog])
    expect(unresolved).toEqual(['unknown0'])
    expect(graph.edges).toEqual([])
  })

  it('maps multiple dependencies to requires in order', () => {
    const linkGsmCatalog = makeCatalog({ type: 'LinkGsm', implements: ['ILink'], requires: [] })
    const multiMsg = makeCatalog({
      type: 'MessageSource',
      implements: [],
      requires: [
        { slot: 'primary', interface: 'ILink', min: 1, max: 1, order: 0 },
        { slot: 'backup', interface: 'ILink', min: 1, max: 1, order: 1 }
      ]
    })
    const topology: Topology = [
      { type: 'LinkEth', id: 'eth0', version: '1.0.0', source: 'diff_broker', dependencies: [], config: {} },
      { type: 'LinkGsm', id: 'gsm0', version: '1.0.0', source: 'diff_broker', dependencies: [], config: {} },
      {
        type: 'MessageSource',
        id: 'msg0',
        version: '1.0.0',
        source: 'diff_broker',
        dependencies: ['eth0', 'gsm0'],
        config: {}
      }
    ]
    const { graph } = topologyToGraph(topology, [linkEthCatalog, linkGsmCatalog, multiMsg])
    const msgEdges = graph.edges.filter((e) => e.targetNodeId === 'msg0')
    expect(msgEdges).toHaveLength(2)
    expect(msgEdges[0].sourceNodeId).toBe('eth0')
    expect(msgEdges[0].targetSlot).toBe('primary')
    expect(msgEdges[1].sourceNodeId).toBe('gsm0')
    expect(msgEdges[1].targetSlot).toBe('backup')
  })
})
