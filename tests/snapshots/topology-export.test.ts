import { describe, expect, it } from 'vitest'

import { makeEdge, makeNode } from '@testing/fixtures'
import { graphToTopology } from '@domain/topology/TopologyMapper'

describe('Topology export snapshot', () => {
  it('matches snapshot for a typical 3-node graph', () => {
    const linkEth = makeNode('linkEth', {
      componentType: 'LinkEth',
      instanceId: 'linkEth0',
      config: {}
    })
    const linkGsm = makeNode('linkGsm', {
      componentType: 'LinkGsm',
      instanceId: 'linkGsm0',
      config: { linkReliability: 70 }
    })
    const messageSource = makeNode('messageSource', {
      componentType: 'MessageSource',
      instanceId: 'messageSource0',
      config: { count: 3, content: 'Diff says hello.' }
    })
    const e1 = makeEdge('e1', 'linkEth', 'messageSource', { sourceSlot: 'ILink', targetSlot: 'link' })
    const e2 = makeEdge('e2', 'linkGsm', 'messageSource', { sourceSlot: 'ILink', targetSlot: 'backupLink' })

    const topology = graphToTopology({
      nodes: [linkEth, linkGsm, messageSource],
      edges: [e1, e2]
    })

    expect(topology).toMatchSnapshot()
  })

  it('matches snapshot for isolated nodes', () => {
    const n1 = makeNode('n1', { componentType: 'Timer', instanceId: 'timer0', config: { intervalMs: 1000 } })
    const n2 = makeNode('n2', { componentType: 'Sensor', instanceId: 'sensor0', config: { sampleRate: 100 } })

    const topology = graphToTopology({ nodes: [n1, n2], edges: [] })
    expect(topology).toMatchSnapshot()
  })

  it('matches JSON output format', () => {
    const node = makeNode('n1', {
      componentType: 'LinkEth',
      instanceId: 'linkEth0',
      config: {}
    })
    const topology = graphToTopology({ nodes: [node], edges: [] })
    const json = JSON.stringify(topology, null, 2)
    expect(json).toMatchSnapshot()
  })
})
