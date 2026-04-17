import { act, renderHook } from '@testing-library/react'
import { makeEdge, makeNode } from '@testing/fixtures'
import type { Connection } from '@xyflow/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useGraphStore } from '@state/graphStore'
import type { CanvasEdge } from '@canvas/canvasTypes'

import { useCanvasConnection } from './useCanvasConnection'

const srcNode = makeNode('src', {
  slots: [{ name: 'ILink', direction: 'out', interface: 'ILink', maxConnections: 1 }]
})

const tgtNode = makeNode('tgt', {
  slots: [{ name: 'link', direction: 'in', interface: 'ILink', maxConnections: 1 }]
})

const incompatibleSrc = makeNode('src', {
  slots: [{ name: 'ITransport', direction: 'out', interface: 'ITransport', maxConnections: 1 }]
})

function graphWith(nodes = [srcNode, tgtNode], edges = []) {
  useGraphStore.setState({ graph: { nodes, edges } })
}

describe('useCanvasConnection', () => {
  beforeEach(() => {
    useGraphStore.setState({
      graph: { nodes: [], edges: [] },
      selectedNodeIds: new Set(),
      selectedEdgeIds: new Set()
    })
  })

  describe('onConnect', () => {
    it('resolves __out__ handle to correct output slot via interface matching', () => {
      graphWith()
      const { result } = renderHook(() => useCanvasConnection())

      act(() => {
        result.current.onConnect({
          source: 'src',
          target: 'tgt',
          sourceHandle: '__out__',
          targetHandle: 'link'
        } as Connection)
      })

      const edges = useGraphStore.getState().graph.edges
      expect(edges).toHaveLength(1)
      expect(edges[0].sourceSlot).toBe('ILink')
      expect(edges[0].id).toBe('src:ILink->tgt:link')
    })

    it('skips if connection fields are missing', () => {
      graphWith()
      const { result } = renderHook(() => useCanvasConnection())

      act(() => {
        result.current.onConnect({
          source: 'src',
          target: null,
          sourceHandle: '__out__',
          targetHandle: 'link'
        } as unknown as Connection)
      })

      expect(useGraphStore.getState().graph.edges).toHaveLength(0)
    })

    it('skips if validation fails due to incompatible interfaces', () => {
      graphWith([incompatibleSrc, tgtNode])
      const { result } = renderHook(() => useCanvasConnection())

      act(() => {
        result.current.onConnect({
          source: 'src',
          target: 'tgt',
          sourceHandle: 'ITransport',
          targetHandle: 'link'
        } as Connection)
      })

      expect(useGraphStore.getState().graph.edges).toHaveLength(0)
    })
  })

  describe('isValidConnection', () => {
    it('rejects self-connection', () => {
      graphWith()
      const { result } = renderHook(() => useCanvasConnection())

      const valid = result.current.isValidConnection({
        source: 'src',
        target: 'src',
        sourceHandle: '__out__',
        targetHandle: 'link'
      } as Connection)

      expect(valid).toBe(false)
    })

    it('accepts compatible __out__ connection', () => {
      graphWith()
      const { result } = renderHook(() => useCanvasConnection())

      const valid = result.current.isValidConnection({
        source: 'src',
        target: 'tgt',
        sourceHandle: '__out__',
        targetHandle: 'link'
      } as Connection)

      expect(valid).toBe(true)
    })

    it('rejects incompatible interfaces via __out__', () => {
      graphWith([incompatibleSrc, tgtNode])
      const { result } = renderHook(() => useCanvasConnection())

      const valid = result.current.isValidConnection({
        source: 'src',
        target: 'tgt',
        sourceHandle: '__out__',
        targetHandle: 'link'
      } as Connection)

      expect(valid).toBe(false)
    })
  })

  describe('onReconnectEnd', () => {
    it('deletes edge when reconnect was not successful', () => {
      const existingEdge = makeEdge('e1', 'src', 'tgt', { sourceSlot: 'ILink', targetSlot: 'link' })
      graphWith([srcNode, tgtNode], [existingEdge] as never)
      const { result } = renderHook(() => useCanvasConnection())

      act(() => {
        result.current.onReconnectStart()
      })

      act(() => {
        result.current.onReconnectEnd(new MouseEvent('mouseup'), {
          id: 'e1',
          source: 'src',
          target: 'tgt'
        } as CanvasEdge)
      })

      expect(useGraphStore.getState().graph.edges).toHaveLength(0)
    })

    it('keeps edge when reconnect was successful', () => {
      const newTgt = makeNode('tgt2', {
        slots: [{ name: 'link', direction: 'in', interface: 'ILink', maxConnections: 1 }]
      })
      const existingEdge = makeEdge('e1', 'src', 'tgt', { sourceSlot: 'ILink', targetSlot: 'link' })
      graphWith([srcNode, tgtNode, newTgt], [existingEdge] as never)
      const { result } = renderHook(() => useCanvasConnection())

      act(() => {
        result.current.onReconnectStart()
      })

      act(() => {
        result.current.onReconnect(
          { id: 'e1', source: 'src', target: 'tgt' } as CanvasEdge,
          { source: 'src', target: 'tgt2', sourceHandle: '__out__', targetHandle: 'link' } as Connection
        )
      })

      act(() => {
        result.current.onReconnectEnd(new MouseEvent('mouseup'), {
          id: 'e1',
          source: 'src',
          target: 'tgt'
        } as CanvasEdge)
      })

      // Old edge removed by onReconnect, new edge added; onReconnectEnd should not remove anything
      const edges = useGraphStore.getState().graph.edges
      expect(edges).toHaveLength(1)
      expect(edges[0].id).toBe('src:ILink->tgt2:link')
    })
  })
})
