import { act, renderHook } from '@testing-library/react'
import { makeEdge, makeNode } from '@testing/fixtures'
import { beforeEach, describe, expect, it } from 'vitest'

import { useGraphStore } from '@state/graphStore'

import { useCanvasState } from './useCanvasState'

describe('useCanvasState', () => {
  beforeEach(() => {
    useGraphStore.setState({
      graph: { nodes: [], edges: [] },
      selectedNodeIds: new Set(),
      selectedEdgeIds: new Set()
    })
  })

  it('initializes with empty arrays', () => {
    const { result } = renderHook(() => useCanvasState())
    expect(result.current.canvasNodes).toEqual([])
    expect(result.current.canvasEdges).toEqual([])
  })

  it('syncs nodes when added to store', () => {
    const { result } = renderHook(() => useCanvasState())

    act(() => {
      useGraphStore.getState().addNode(makeNode('n1'))
    })

    expect(result.current.canvasNodes).toHaveLength(1)
    expect(result.current.canvasNodes[0].id).toBe('n1')
  })

  it('syncs edges when added to store', () => {
    useGraphStore.setState({
      graph: { nodes: [makeNode('n1'), makeNode('n2')], edges: [] }
    })
    const { result } = renderHook(() => useCanvasState())

    act(() => {
      useGraphStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'))
    })

    expect(result.current.canvasEdges).toHaveLength(1)
    expect(result.current.canvasEdges[0].id).toBe('e1')
  })

  it('preserves UI state (selected) for existing nodes', () => {
    const node = makeNode('n1')
    useGraphStore.setState({
      graph: { nodes: [node], edges: [] },
      selectedNodeIds: new Set(['n1'])
    })

    const { result } = renderHook(() => useCanvasState())
    expect(result.current.canvasNodes[0].selected).toBe(true)

    act(() => {
      // Simulate store update that doesn't change selection
      useGraphStore.getState().addNode(makeNode('n2'))
    })

    expect(result.current.canvasNodes.find((n) => n.id === 'n1')?.selected).toBe(true)
  })
})
