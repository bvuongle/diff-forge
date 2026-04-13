import { makeEdge, makeNode } from '@testing/fixtures'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGraphStore } from '@state/graphStore'

describe('graphStore', () => {
  beforeEach(() => {
    useGraphStore.setState({
      graph: { nodes: [], edges: [] },
      selectedNodeIds: new Set(),
      selectedEdgeId: null
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

    it('clears selectedEdgeId if removed edge was selected', () => {
      useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
      useGraphStore.getState().selectEdge('e1')
      useGraphStore.getState().removeEdge('e1')
      expect(useGraphStore.getState().selectedEdgeId).toBeNull()
    })

    it('preserves selectedEdgeId if a different edge is removed', () => {
      useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
      useGraphStore.getState().addEdge(makeEdge('e2', 'n2', 'n3'))
      useGraphStore.getState().selectEdge('e2')
      useGraphStore.getState().removeEdge('e1')
      expect(useGraphStore.getState().selectedEdgeId).toBe('e2')
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
    it('selects a single node and clears selectedEdgeId', () => {
      useGraphStore.setState({ selectedEdgeId: 'e1' })
      useGraphStore.getState().selectNode('n1')
      const state = useGraphStore.getState()
      expect(state.selectedNodeIds.has('n1')).toBe(true)
      expect(state.selectedNodeIds.size).toBe(1)
      expect(state.selectedEdgeId).toBeNull()
    })

    it('clears all selection when null is passed', () => {
      useGraphStore.getState().selectNode('n1')
      useGraphStore.getState().selectNode(null)
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(0)
    })

    it('additive mode toggles node into selection', () => {
      useGraphStore.getState().selectNode('n1')
      useGraphStore.getState().selectNode('n2', true)
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(2)
      expect(useGraphStore.getState().selectedNodeIds.has('n1')).toBe(true)
      expect(useGraphStore.getState().selectedNodeIds.has('n2')).toBe(true)
    })

    it('additive mode toggles node out of selection', () => {
      useGraphStore.getState().selectNode('n1')
      useGraphStore.getState().selectNode('n2', true)
      useGraphStore.getState().selectNode('n1', true)
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(1)
      expect(useGraphStore.getState().selectedNodeIds.has('n2')).toBe(true)
    })
  })

  describe('selectNodes', () => {
    it('selects multiple nodes at once', () => {
      useGraphStore.getState().selectNodes(['n1', 'n2', 'n3'])
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(3)
    })

    it('clears selectedEdgeId', () => {
      useGraphStore.setState({ selectedEdgeId: 'e1' })
      useGraphStore.getState().selectNodes(['n1'])
      expect(useGraphStore.getState().selectedEdgeId).toBeNull()
    })
  })

  describe('selectEdge', () => {
    it('sets selectedEdgeId', () => {
      useGraphStore.getState().selectEdge('e1')
      expect(useGraphStore.getState().selectedEdgeId).toBe('e1')
    })

    it('deselects when null is passed', () => {
      useGraphStore.getState().selectEdge('e1')
      useGraphStore.getState().selectEdge(null)
      expect(useGraphStore.getState().selectedEdgeId).toBeNull()
    })
  })

  describe('clearSelection', () => {
    it('clears both node and edge selection', () => {
      useGraphStore.getState().selectNode('n1')
      useGraphStore.getState().selectEdge('e1')
      useGraphStore.getState().clearSelection()
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(0)
      expect(useGraphStore.getState().selectedEdgeId).toBeNull()
    })
  })

  describe('removeSelectedNodes', () => {
    it('removes all selected nodes and their edges', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().addNode(makeNode('n2'))
      useGraphStore.getState().addNode(makeNode('n3'))
      useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
      useGraphStore.getState().selectNodes(['n1', 'n2'])
      useGraphStore.getState().removeSelectedNodes()
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

  describe('updateNodeVersion', () => {
    it('updates version and slots on the node', () => {
      useGraphStore.getState().addNode(
        makeNode('n1', {
          version: '1.0.0',
          config: { count: 3 },
          slots: [{ name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: Infinity }]
        })
      )
      const newSlots = [{ name: 'ILinkV2', interface: 'ILinkV2', direction: 'out' as const, maxConnections: Infinity }]
      useGraphStore.getState().updateNodeVersion('n1', '2.0.0', newSlots, { count: null })
      const node = useGraphStore.getState().graph.nodes[0]
      expect(node.version).toBe('2.0.0')
      expect(node.slots).toEqual(newSlots)
    })

    it('migrates config keys that exist in new schema', () => {
      useGraphStore.getState().addNode(
        makeNode('n1', {
          config: { count: 3, content: 'hello', removed: true }
        })
      )
      useGraphStore.getState().updateNodeVersion('n1', '2.0.0', [], {
        count: { type: 'int' },
        content: { type: 'string' }
      })
      const node = useGraphStore.getState().graph.nodes[0]
      expect(node.config).toEqual({ count: 3, content: 'hello' })
    })

    it('drops config keys not in new schema', () => {
      useGraphStore.getState().addNode(
        makeNode('n1', {
          config: { oldKey: 'value' }
        })
      )
      useGraphStore.getState().updateNodeVersion('n1', '2.0.0', [], {})
      const node = useGraphStore.getState().graph.nodes[0]
      expect(node.config).toEqual({})
    })
  })
})
