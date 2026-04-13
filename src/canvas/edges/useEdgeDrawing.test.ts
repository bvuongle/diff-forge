import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEdgeDrawing } from './useEdgeDrawing'
import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'
import { makeNode } from '@testing/fixtures'

function makeCanvasRef() {
  const div = document.createElement('div')
  Object.defineProperty(div, 'getBoundingClientRect', {
    value: () => ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => {} })
  })
  return { current: div }
}

function makePortEl(rect = { left: 10, top: 10, width: 16, height: 16 }) {
  const el = document.createElement('div')
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top, toJSON: () => {} })
  })
  return el
}

describe('useEdgeDrawing', () => {
  beforeEach(() => {
    useGraphStore.setState({
      graph: { nodes: [], edges: [] },
      selectedNodeIds: new Set(),
      selectedEdgeId: null
    })
    useUIStore.setState({ dragInfo: null })
  })

  it('initializes with no drag edge', () => {
    const canvasRef = makeCanvasRef()
    const { result } = renderHook(() => useEdgeDrawing(canvasRef, 1, 0, 0))
    expect(result.current.dragEdge).toBeNull()
  })

  it('starts drag edge on port mouse down', () => {
    const node = makeNode('n1', {
      slots: [
        { name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: Infinity }
      ]
    })
    useGraphStore.getState().addNode(node)

    const canvasRef = makeCanvasRef()
    const portEl = makePortEl()
    const { result } = renderHook(() => useEdgeDrawing(canvasRef, 1, 0, 0))

    act(() => {
      const fakeEvent = {
        stopPropagation: () => {},
        preventDefault: () => {},
        clientX: 18,
        clientY: 18
      } as unknown as React.MouseEvent
      result.current.onPortMouseDown(fakeEvent, 'n1', 'ILink', portEl)
    })

    expect(result.current.dragEdge).not.toBeNull()
    expect(result.current.dragEdge?.sourceNodeId).toBe('n1')
    expect(result.current.dragEdge?.sourceSlot).toBe('ILink')
  })

  it('sets dragInfo in uiStore during drag', () => {
    const node = makeNode('n1', {
      slots: [
        { name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: Infinity }
      ]
    })
    useGraphStore.getState().addNode(node)

    const canvasRef = makeCanvasRef()
    const portEl = makePortEl()
    const { result } = renderHook(() => useEdgeDrawing(canvasRef, 1, 0, 0))

    act(() => {
      const fakeEvent = {
        stopPropagation: () => {},
        preventDefault: () => {},
        clientX: 18,
        clientY: 18
      } as unknown as React.MouseEvent
      result.current.onPortMouseDown(fakeEvent, 'n1', 'ILink', portEl)
    })

    const dragInfo = useUIStore.getState().dragInfo
    expect(dragInfo).not.toBeNull()
    expect(dragInfo?.sourceNodeId).toBe('n1')
    expect(dragInfo?.sourceInterfaces).toEqual(['ILink'])
  })

  it('clears drag edge on mouseup', () => {
    document.elementFromPoint = vi.fn().mockReturnValue(null)

    const node = makeNode('n1', {
      slots: [
        { name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: Infinity }
      ]
    })
    useGraphStore.getState().addNode(node)

    const canvasRef = makeCanvasRef()
    const portEl = makePortEl()
    const { result } = renderHook(() => useEdgeDrawing(canvasRef, 1, 0, 0))

    act(() => {
      const fakeEvent = {
        stopPropagation: () => {},
        preventDefault: () => {},
        clientX: 18,
        clientY: 18
      } as unknown as React.MouseEvent
      result.current.onPortMouseDown(fakeEvent, 'n1', 'ILink', portEl)
    })

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup', { clientX: 100, clientY: 100 }))
    })

    expect(result.current.dragEdge).toBeNull()
    expect(useUIStore.getState().dragInfo).toBeNull()
  })

  it('does nothing when canvas ref is null', () => {
    const nullRef = { current: null }
    const { result } = renderHook(() => useEdgeDrawing(nullRef, 1, 0, 0))

    act(() => {
      const fakeEvent = {
        stopPropagation: () => {},
        preventDefault: () => {},
        clientX: 18,
        clientY: 18
      } as unknown as React.MouseEvent
      result.current.onPortMouseDown(fakeEvent, 'n1', 'ILink', makePortEl())
    })

    expect(result.current.dragEdge).toBeNull()
  })
})
