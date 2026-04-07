import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from '@state/graphStore'
import { makeNode, makeEdge } from '@testing/fixtures'

describe('graphStore', () => {
  beforeEach(() => {
    useGraphStore.setState({
      graph: { nodes: [], edges: [] },
      selectedNodeId: null,
      selectedEdgeId: null
    })
  })

  it('addNode adds to graph', () => {
    useGraphStore.getState().addNode(makeNode('n1'))
    expect(useGraphStore.getState().graph.nodes).toHaveLength(1)
  })

  it('removeNode removes from graph', () => {
    useGraphStore.getState().addNode(makeNode('n1'))
    useGraphStore.getState().removeNode('n1')
    expect(useGraphStore.getState().graph.nodes).toHaveLength(0)
  })

  it('selectNode sets selectedNodeId and clears selectedEdgeId', () => {
    useGraphStore.setState({ selectedEdgeId: 'e1' })
    useGraphStore.getState().selectNode('n1')
    const state = useGraphStore.getState()
    expect(state.selectedNodeId).toBe('n1')
    expect(state.selectedEdgeId).toBeNull()
  })

  it('selectEdge sets selectedEdgeId without clearing selectedNodeId', () => {
    useGraphStore.getState().selectNode('n1')
    useGraphStore.getState().selectEdge('e1')
    const state = useGraphStore.getState()
    expect(state.selectedEdgeId).toBe('e1')
    expect(state.selectedNodeId).toBe('n1')
  })

  it('removeNode clears selection if removed node was selected', () => {
    useGraphStore.getState().addNode(makeNode('n1'))
    useGraphStore.getState().selectNode('n1')
    useGraphStore.getState().removeNode('n1')
    expect(useGraphStore.getState().selectedNodeId).toBeNull()
  })

  it('removeNode preserves selection of other nodes', () => {
    useGraphStore.getState().addNode(makeNode('n1'))
    useGraphStore.getState().addNode(makeNode('n2'))
    useGraphStore.getState().selectNode('n2')
    useGraphStore.getState().removeNode('n1')
    expect(useGraphStore.getState().selectedNodeId).toBe('n2')
  })

  it('addEdge/removeEdge mutates edges', () => {
    useGraphStore.getState().addNode(makeNode('n1'))
    useGraphStore.getState().addNode(makeNode('n2'))
    useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
    expect(useGraphStore.getState().graph.edges).toHaveLength(1)

    useGraphStore.getState().removeEdge('e1')
    expect(useGraphStore.getState().graph.edges).toHaveLength(0)
  })

  it('removeEdge clears selectedEdgeId if removed edge was selected', () => {
    useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
    useGraphStore.getState().selectEdge('e1')
    useGraphStore.getState().removeEdge('e1')
    expect(useGraphStore.getState().selectedEdgeId).toBeNull()
  })
})
