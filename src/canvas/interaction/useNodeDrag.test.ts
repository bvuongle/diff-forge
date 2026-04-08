import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNodeDrag } from './useNodeDrag'
import { useGraphStore } from '@state/graphStore'
import { makeNode } from '@testing/fixtures'

describe('useNodeDrag', () => {
  beforeEach(() => {
    useGraphStore.setState({
      graph: { nodes: [], edges: [] },
      selectedNodeIds: new Set(),
      selectedEdgeId: null
    })
  })

  it('moves node position based on mouse delta and zoom', () => {
    useGraphStore.getState().addNode(makeNode('n1', { position: { x: 100, y: 200 } }))
    const { result } = renderHook(() => useNodeDrag(1))

    act(() => {
      result.current.onMoveStart('n1', 50, 50)
    })

    act(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 100 }))
    })

    const node = useGraphStore.getState().graph.nodes[0]
    expect(node.position.x).toBe(200) // 100 + (150-50)/1
    expect(node.position.y).toBe(250) // 200 + (100-50)/1
  })

  it('accounts for zoom level when calculating delta', () => {
    useGraphStore.getState().addNode(makeNode('n1', { position: { x: 0, y: 0 } }))
    const { result } = renderHook(() => useNodeDrag(2))

    act(() => {
      result.current.onMoveStart('n1', 0, 0)
    })

    act(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }))
    })

    const node = useGraphStore.getState().graph.nodes[0]
    expect(node.position.x).toBe(50) // 100/2
    expect(node.position.y).toBe(50) // 100/2
  })

  it('stops tracking on mouseup', () => {
    useGraphStore.getState().addNode(makeNode('n1', { position: { x: 0, y: 0 } }))
    const { result } = renderHook(() => useNodeDrag(1))

    act(() => {
      result.current.onMoveStart('n1', 0, 0)
    })

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup'))
    })

    act(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 999, clientY: 999 }))
    })

    const node = useGraphStore.getState().graph.nodes[0]
    expect(node.position).toEqual({ x: 0, y: 0 })
  })

  it('does nothing if node not found', () => {
    const { result } = renderHook(() => useNodeDrag(1))
    act(() => {
      result.current.onMoveStart('nonexistent', 0, 0)
    })
  })
})
