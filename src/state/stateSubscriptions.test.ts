import { beforeEach, describe, expect, it } from 'vitest'

import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'
import { makeEdge, makeNode } from '@testing/fixtures'

import { setupStateSubscriptions } from './stateSubscriptions'

describe('stateSubscriptions', () => {
  let unsubscribe: () => void

  beforeEach(() => {
    useGraphStore.setState({
      graph: { nodes: [], edges: [] },
      selectedNodeIds: new Set(),
      selectedEdgeIds: new Set()
    })
    useUIStore.setState({
      expandedNodeIds: new Set(),
      canvasMode: 'select',
      snapToGrid: false,
      animateEdges: false,
      searchQuery: ''
    })
    unsubscribe?.()
    unsubscribe = setupStateSubscriptions()
  })

  it('prunes expandedNodeIds when the node is removed from the graph', () => {
    useGraphStore.setState({ graph: { nodes: [makeNode('n1'), makeNode('n2')], edges: [] } })
    useUIStore.setState({ expandedNodeIds: new Set(['n1', 'n2']) })

    useGraphStore.getState().removeNode('n1')

    expect(useUIStore.getState().expandedNodeIds.has('n1')).toBe(false)
    expect(useUIStore.getState().expandedNodeIds.has('n2')).toBe(true)
  })

  it('does not revive expand state when a node id is reused after deletion', () => {
    useGraphStore.setState({ graph: { nodes: [makeNode('linkEth0')], edges: [] } })
    useUIStore.setState({ expandedNodeIds: new Set(['linkEth0']) })

    useGraphStore.getState().removeNode('linkEth0')
    useGraphStore.getState().addNode(makeNode('linkEth0'))

    expect(useUIStore.getState().expandedNodeIds.has('linkEth0')).toBe(false)
  })

  it('prunes selectedEdgeIds when the edges are cascaded by node removal', () => {
    const n1 = makeNode('n1')
    const n2 = makeNode('n2')
    useGraphStore.setState({
      graph: { nodes: [n1, n2], edges: [makeEdge('e1', 'n1', 'n2')] },
      selectedEdgeIds: new Set(['e1'])
    })

    useGraphStore.getState().removeNode('n1')

    expect(useGraphStore.getState().selectedEdgeIds.has('e1')).toBe(false)
  })

  it('leaves valid ids untouched', () => {
    useGraphStore.setState({ graph: { nodes: [makeNode('keep')], edges: [] } })
    useUIStore.setState({ expandedNodeIds: new Set(['keep']) })
    useGraphStore.setState({ selectedNodeIds: new Set(['keep']) })

    useGraphStore.getState().addNode(makeNode('newNode'))

    expect(useUIStore.getState().expandedNodeIds.has('keep')).toBe(true)
    expect(useGraphStore.getState().selectedNodeIds.has('keep')).toBe(true)
  })
})
