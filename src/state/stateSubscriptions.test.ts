import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { computeInvalidNodeIds } from '@core/graph/graphValidation'
import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'
import { makeEdge, makeNode } from '@testing/fixtures'

import { setupStateSubscriptions, VALIDATION_DEBOUNCE_MS } from './stateSubscriptions'

describe('stateSubscriptions', () => {
  let unsubscribe: () => void

  beforeEach(() => {
    useGraphStore.setState({
      graph: { nodes: [], edges: [] },
      selectedNodeIds: new Set(),
      selectedEdgeIds: new Set(),
      flaggedNodeIds: new Set()
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

describe('computeInvalidNodeIds', () => {
  it('returns empty set for an empty graph', () => {
    expect(computeInvalidNodeIds({ nodes: [], edges: [] })).toEqual(new Set())
  })

  it('flags every node in a cycle', () => {
    const nodes = [makeNode('a'), makeNode('b')]
    const edges = [makeEdge('e1', 'a', 'b'), makeEdge('e2', 'b', 'a')]
    expect(computeInvalidNodeIds({ nodes, edges })).toEqual(new Set(['a', 'b']))
  })

  it('flags nodes with unfilled required slots', () => {
    const nodes = [makeNode('msg', { slots: [{ name: 'link', type: 'ILink', direction: 'in', isArray: false }] })]
    expect(computeInvalidNodeIds({ nodes, edges: [] })).toEqual(new Set(['msg']))
  })

  it('does not flag nodes whose only in-slot is array-type and unwired', () => {
    const nodes = [makeNode('router', { slots: [{ name: 'links', type: 'ILink', direction: 'in', isArray: true }] })]
    expect(computeInvalidNodeIds({ nodes, edges: [] })).toEqual(new Set())
  })
})

describe('flaggedNodeIds pruning', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does no work when flaggedNodeIds is empty (new node stays unflagged)', () => {
    useGraphStore.setState({ flaggedNodeIds: new Set() })
    useGraphStore.setState({
      graph: {
        nodes: [makeNode('msg', { slots: [{ name: 'link', type: 'ILink', direction: 'in', isArray: false }] })],
        edges: []
      }
    })
    vi.advanceTimersByTime(VALIDATION_DEBOUNCE_MS)
    expect(useGraphStore.getState().flaggedNodeIds.has('msg')).toBe(false)
  })

  it('prunes a flagged id once its slot is wired', () => {
    useGraphStore.setState({
      graph: {
        nodes: [
          makeNode('src', { slots: [{ name: 'ILink', type: 'ILink', direction: 'out', isArray: true }] }),
          makeNode('msg', { slots: [{ name: 'link', type: 'ILink', direction: 'in', isArray: false }] })
        ],
        edges: []
      },
      flaggedNodeIds: new Set(['msg'])
    })

    useGraphStore.getState().addEdge(makeEdge('e1', 'src', 'msg', { sourceSlot: 'ILink', targetSlot: 'link' }))
    vi.advanceTimersByTime(VALIDATION_DEBOUNCE_MS)
    expect(useGraphStore.getState().flaggedNodeIds.has('msg')).toBe(false)
  })

  it('prunes a flagged id once the node is deleted', () => {
    useGraphStore.setState({
      graph: {
        nodes: [makeNode('msg', { slots: [{ name: 'link', type: 'ILink', direction: 'in', isArray: false }] })],
        edges: []
      },
      flaggedNodeIds: new Set(['msg'])
    })

    useGraphStore.getState().removeNode('msg')
    vi.advanceTimersByTime(VALIDATION_DEBOUNCE_MS)
    expect(useGraphStore.getState().flaggedNodeIds.has('msg')).toBe(false)
  })

  it('does NOT add a freshly-dropped invalid node to flaggedNodeIds', () => {
    useGraphStore.setState({
      graph: {
        nodes: [
          makeNode('flagged-already', { slots: [{ name: 'link', type: 'ILink', direction: 'in', isArray: false }] })
        ],
        edges: []
      },
      flaggedNodeIds: new Set(['flagged-already'])
    })

    useGraphStore
      .getState()
      .addNode(makeNode('new', { slots: [{ name: 'link', type: 'ILink', direction: 'in', isArray: false }] }))
    vi.advanceTimersByTime(VALIDATION_DEBOUNCE_MS)

    const flagged = useGraphStore.getState().flaggedNodeIds
    expect(flagged.has('flagged-already')).toBe(true)
    expect(flagged.has('new')).toBe(false)
  })
})
