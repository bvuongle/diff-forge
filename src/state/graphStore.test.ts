import { beforeEach, describe, expect, it } from 'vitest'

import { useGraphStore } from '@state/graphStore'
import { makeEdge, makeNode } from '@testing/fixtures'

describe('graphStore', () => {
  beforeEach(() => {
    useGraphStore.setState({
      graph: { nodes: [], edges: [] },
      dirty: false,
      selectedNodeIds: new Set(),
      selectedEdgeIds: new Set()
    })
  })

  describe('addNode', () => {
    it('adds to graph', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      expect(useGraphStore.getState().graph.nodes).toHaveLength(1)
    })

    it('throws on duplicate node id', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      expect(() => useGraphStore.getState().addNode(makeNode('n1'))).toThrow('already exists')
    })
  })

  describe('removeNode', () => {
    it('removes from graph', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().removeNode('n1')
      expect(useGraphStore.getState().graph.nodes).toHaveLength(0)
    })

    it('clears selection if removed node was selected', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().selectNode('n1')
      useGraphStore.getState().removeNode('n1')
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(0)
    })

    it('preserves selection of other nodes', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().addNode(makeNode('n2'))
      useGraphStore.getState().selectNode('n2')
      useGraphStore.getState().removeNode('n1')
      expect(useGraphStore.getState().selectedNodeIds.has('n2')).toBe(true)
    })

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

  describe('addEdge', () => {
    it('adds edge to graph', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().addNode(makeNode('n2'))
      useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
      expect(useGraphStore.getState().graph.edges).toHaveLength(1)
    })

    it('throws on duplicate edge id', () => {
      useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
      expect(() => useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))).toThrow('already exists')
    })
  })

  describe('removeEdge', () => {
    it('removes edge from graph', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().addNode(makeNode('n2'))
      useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
      useGraphStore.getState().removeEdge('e1')
      expect(useGraphStore.getState().graph.edges).toHaveLength(0)
    })

    it('clears selectedEdgeIds if removed edge was selected', () => {
      useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
      useGraphStore.getState().selectEdge('e1')
      useGraphStore.getState().removeEdge('e1')
      expect(useGraphStore.getState().selectedEdgeIds.size).toBe(0)
    })

    it('preserves selectedEdgeIds if a different edge is removed', () => {
      useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
      useGraphStore.getState().addEdge(makeEdge('e2', 'n2', 'n3'))
      useGraphStore.getState().selectEdge('e2')
      useGraphStore.getState().removeEdge('e1')
      expect(useGraphStore.getState().selectedEdgeIds.has('e2')).toBe(true)
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
    it('selects a single node and clears selectedEdgeIds', () => {
      useGraphStore.setState({ selectedEdgeIds: new Set(['e1']) })
      useGraphStore.getState().selectNode('n1')
      const state = useGraphStore.getState()
      expect(state.selectedNodeIds.has('n1')).toBe(true)
      expect(state.selectedNodeIds.size).toBe(1)
      expect(state.selectedEdgeIds.size).toBe(0)
    })

    it('clears all selection when null is passed', () => {
      useGraphStore.getState().selectNode('n1')
      useGraphStore.getState().selectNode(null)
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(0)
    })
  })

  describe('selectEdge', () => {
    it('sets selectedEdgeIds and clears selectedNodeIds', () => {
      useGraphStore.setState({ selectedNodeIds: new Set(['n1']) })
      useGraphStore.getState().selectEdge('e1')
      expect(useGraphStore.getState().selectedEdgeIds.has('e1')).toBe(true)
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(0)
    })

    it('deselects when null is passed', () => {
      useGraphStore.getState().selectEdge('e1')
      useGraphStore.getState().selectEdge(null)
      expect(useGraphStore.getState().selectedEdgeIds.size).toBe(0)
    })
  })

  describe('selectElements', () => {
    it('selects both nodes and edges at once', () => {
      useGraphStore.getState().selectElements(['n1', 'n2'], ['e1', 'e2'])
      const state = useGraphStore.getState()
      expect(state.selectedNodeIds.size).toBe(2)
      expect(state.selectedEdgeIds.size).toBe(2)
      expect(state.selectedEdgeIds.has('e1')).toBe(true)
    })
  })

  describe('clearSelection', () => {
    it('clears both node and edge selection', () => {
      useGraphStore.getState().selectNode('n1')
      useGraphStore.getState().selectEdge('e1')
      useGraphStore.getState().clearSelection()
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(0)
      expect(useGraphStore.getState().selectedEdgeIds.size).toBe(0)
    })
  })

  describe('removeSelected', () => {
    it('removes all selected nodes and their edges', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().addNode(makeNode('n2'))
      useGraphStore.getState().addNode(makeNode('n3'))
      useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
      useGraphStore.getState().selectElements(['n1', 'n2'], [])
      useGraphStore.getState().removeSelected()
      expect(useGraphStore.getState().graph.nodes).toHaveLength(1)
      expect(useGraphStore.getState().graph.nodes[0].id).toBe('n3')
      expect(useGraphStore.getState().graph.edges).toHaveLength(0)
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(0)
    })
  })

  describe('renameNode', () => {
    it('renames node id and instanceId', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().renameNode('n1', 'renamedNode')
      const node = useGraphStore.getState().graph.nodes[0]
      expect(node.id).toBe('renamedNode')
      expect(node.instanceId).toBe('renamedNode')
    })

    it('updates selectedNodeIds when the selected node is renamed', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().selectNode('n1')
      useGraphStore.getState().renameNode('n1', 'n1-new')
      expect(useGraphStore.getState().selectedNodeIds.has('n1-new')).toBe(true)
      expect(useGraphStore.getState().selectedNodeIds.has('n1')).toBe(false)
    })

    it('preserves selection when a different node is renamed', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().addNode(makeNode('n2'))
      useGraphStore.getState().selectNode('n2')
      useGraphStore.getState().renameNode('n1', 'n1-new')
      expect(useGraphStore.getState().selectedNodeIds.has('n2')).toBe(true)
    })

    it('updates edge references when node is renamed', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().addNode(makeNode('n2'))
      useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
      useGraphStore.getState().renameNode('n1', 'renamed')
      const edge = useGraphStore.getState().graph.edges[0]
      expect(edge.sourceNodeId).toBe('renamed')
      expect(edge.targetNodeId).toBe('n2')
    })
  })

  describe('dirty tracking', () => {
    it('starts clean', () => {
      expect(useGraphStore.getState().dirty).toBe(false)
    })

    it('addNode marks dirty', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      expect(useGraphStore.getState().dirty).toBe(true)
    })

    it('addEdge, moveNode, updateNodeConfig, removeNode, removeEdge, renameNode, removeSelected all mark dirty', () => {
      const s = useGraphStore.getState()
      s.addNode(makeNode('n1'))
      s.addNode(makeNode('n2'))
      s.markClean()
      s.addEdge(makeEdge('e1', 'n1', 'n2'))
      expect(useGraphStore.getState().dirty).toBe(true)
      s.markClean()
      s.moveNode('n1', { x: 10, y: 10 })
      expect(useGraphStore.getState().dirty).toBe(true)
      s.markClean()
      s.updateNodeConfig('n1', { a: 1 })
      expect(useGraphStore.getState().dirty).toBe(true)
      s.markClean()
      s.renameNode('n1', 'renamed')
      expect(useGraphStore.getState().dirty).toBe(true)
      s.markClean()
      s.removeEdge('e1')
      expect(useGraphStore.getState().dirty).toBe(true)
      s.markClean()
      s.selectNode('renamed')
      expect(useGraphStore.getState().dirty).toBe(false)
      s.removeSelected()
      expect(useGraphStore.getState().dirty).toBe(true)
    })

    it('selection changes do not mark dirty', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().markClean()
      useGraphStore.getState().selectNode('n1')
      useGraphStore.getState().clearSelection()
      expect(useGraphStore.getState().dirty).toBe(false)
    })

    it('setGraph resets dirty to false', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      expect(useGraphStore.getState().dirty).toBe(true)
      useGraphStore.getState().setGraph({ nodes: [], edges: [] })
      expect(useGraphStore.getState().dirty).toBe(false)
    })

    it('markClean clears dirty', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().markClean()
      expect(useGraphStore.getState().dirty).toBe(false)
    })
  })
})
