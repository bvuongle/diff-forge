import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from '@state/graphStore'
import { makeNode, makeEdge } from '../fixtures'

describe('graphStore — extended', () => {
  beforeEach(() => {
    useGraphStore.setState({
      graph: { nodes: [], edges: [] },
      selectedNodeId: null,
      selectedEdgeId: null
    })
  })

  describe('moveNode', () => {
    it('updates node position in graph', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().moveNode('n1', { x: 100, y: 200 })
      const node = useGraphStore.getState().graph.nodes[0]
      expect(node.position).toEqual({ x: 100, y: 200 })
    })

    it('does not affect other nodes', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().addNode(makeNode('n2', { position: { x: 50, y: 50 } }))
      useGraphStore.getState().moveNode('n1', { x: 100, y: 200 })
      const n2 = useGraphStore.getState().graph.nodes[1]
      expect(n2.position).toEqual({ x: 50, y: 50 })
    })
  })

  describe('updateNodeConfig', () => {
    it('sets config on the node', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().updateNodeConfig('n1', { count: 3, content: 'hello' })
      const node = useGraphStore.getState().graph.nodes[0]
      expect(node.config).toEqual({ count: 3, content: 'hello' })
    })
  })

  describe('selectNode', () => {
    it('deselects when null is passed', () => {
      useGraphStore.getState().selectNode('n1')
      useGraphStore.getState().selectNode(null)
      expect(useGraphStore.getState().selectedNodeId).toBeNull()
    })

    it('clears selectedEdgeId when selecting a node', () => {
      useGraphStore.getState().selectEdge('e1')
      useGraphStore.getState().selectNode('n1')
      expect(useGraphStore.getState().selectedEdgeId).toBeNull()
    })
  })

  describe('selectEdge', () => {
    it('deselects when null is passed', () => {
      useGraphStore.getState().selectEdge('e1')
      useGraphStore.getState().selectEdge(null)
      expect(useGraphStore.getState().selectedEdgeId).toBeNull()
    })

    it('does not clear selectedNodeId when selecting an edge', () => {
      useGraphStore.getState().selectNode('n1')
      useGraphStore.getState().selectEdge('e1')
      expect(useGraphStore.getState().selectedNodeId).toBe('n1')
    })
  })

  describe('removeNode — cascading behavior', () => {
    it('removes edges where node is source', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().addNode(makeNode('n2'))
      useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
      useGraphStore.getState().removeNode('n1')
      expect(useGraphStore.getState().graph.edges).toHaveLength(0)
    })

    it('removes edges where node is target', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().addNode(makeNode('n2'))
      useGraphStore.getState().addEdge(makeEdge('e1', 'n2', 'n1'))
      useGraphStore.getState().removeNode('n1')
      expect(useGraphStore.getState().graph.edges).toHaveLength(0)
    })
  })

  describe('removeEdge — selection behavior', () => {
    it('preserves selectedEdgeId if a different edge is removed', () => {
      useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
      useGraphStore.getState().addEdge(makeEdge('e2', 'n2', 'n3'))
      useGraphStore.getState().selectEdge('e2')
      useGraphStore.getState().removeEdge('e1')
      expect(useGraphStore.getState().selectedEdgeId).toBe('e2')
    })
  })

  describe('addNode — error handling', () => {
    it('throws on duplicate node id', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      expect(() => useGraphStore.getState().addNode(makeNode('n1'))).toThrow('already exists')
    })
  })

  describe('addEdge — error handling', () => {
    it('throws on duplicate edge id', () => {
      useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
      expect(() => useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))).toThrow('already exists')
    })
  })
})
