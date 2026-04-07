import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from '@state/graphStore'
import { makeNode, makeEdge } from '@testing/fixtures'

describe('graphStore — renameNode + updateNodeVersion', () => {
  beforeEach(() => {
    useGraphStore.setState({
      graph: { nodes: [], edges: [] },
      selectedNodeId: null,
      selectedEdgeId: null
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

    it('updates selectedNodeId when the selected node is renamed', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().selectNode('n1')
      useGraphStore.getState().renameNode('n1', 'n1-new')
      expect(useGraphStore.getState().selectedNodeId).toBe('n1-new')
    })

    it('preserves selectedNodeId when a different node is renamed', () => {
      useGraphStore.getState().addNode(makeNode('n1'))
      useGraphStore.getState().addNode(makeNode('n2'))
      useGraphStore.getState().selectNode('n2')
      useGraphStore.getState().renameNode('n1', 'n1-new')
      expect(useGraphStore.getState().selectedNodeId).toBe('n2')
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
      useGraphStore.getState().addNode(makeNode('n1', {
        version: '1.0.0',
        config: { count: 3 },
        slots: [{ name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: Infinity }]
      }))
      const newSlots = [
        { name: 'ILinkV2', interface: 'ILinkV2', direction: 'out' as const, maxConnections: Infinity }
      ]
      useGraphStore.getState().updateNodeVersion('n1', '2.0.0', newSlots, { count: null })
      const node = useGraphStore.getState().graph.nodes[0]
      expect(node.version).toBe('2.0.0')
      expect(node.slots).toEqual(newSlots)
    })

    it('migrates config keys that exist in new schema', () => {
      useGraphStore.getState().addNode(makeNode('n1', {
        config: { count: 3, content: 'hello', removed: true }
      }))
      useGraphStore.getState().updateNodeVersion('n1', '2.0.0', [], {
        count: { type: 'int' },
        content: { type: 'string' }
      })
      const node = useGraphStore.getState().graph.nodes[0]
      expect(node.config).toEqual({ count: 3, content: 'hello' })
    })

    it('drops config keys not in new schema', () => {
      useGraphStore.getState().addNode(makeNode('n1', {
        config: { oldKey: 'value' }
      }))
      useGraphStore.getState().updateNodeVersion('n1', '2.0.0', [], {})
      const node = useGraphStore.getState().graph.nodes[0]
      expect(node.config).toEqual({})
    })
  })
})
