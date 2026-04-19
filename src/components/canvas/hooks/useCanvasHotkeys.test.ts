import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'
import { makeNode } from '@testing/fixtures'

import { useCanvasHotkeys } from './useCanvasHotkeys'

function fireKey(type: 'keydown' | 'keyup', opts: KeyboardEventInit & { targetElement?: HTMLElement } = {}) {
  const { targetElement, ...eventOpts } = opts
  const event = new KeyboardEvent(type, { bubbles: true, ...eventOpts })
  if (targetElement) {
    Object.defineProperty(event, 'target', { value: targetElement })
  }
  window.dispatchEvent(event)
}

describe('useCanvasHotkeys', () => {
  beforeEach(() => {
    useGraphStore.setState({
      graph: { nodes: [], edges: [] },
      selectedNodeIds: new Set(),
      selectedEdgeIds: new Set()
    })
    useUIStore.setState({ canvasMode: 'select' })
  })

  it('Delete key removes selected nodes', () => {
    const n1 = makeNode('n1')
    const n2 = makeNode('n2')
    useGraphStore.setState({
      graph: { nodes: [n1, n2], edges: [] },
      selectedNodeIds: new Set(['n1'])
    })

    renderHook(() => useCanvasHotkeys())

    act(() => {
      fireKey('keydown', { key: 'Delete' })
    })

    const { nodes } = useGraphStore.getState().graph
    expect(nodes).toHaveLength(1)
    expect(nodes[0].id).toBe('n2')
  })

  it('Backspace key removes selected nodes', () => {
    const n1 = makeNode('n1')
    const n2 = makeNode('n2')
    useGraphStore.setState({
      graph: { nodes: [n1, n2], edges: [] },
      selectedNodeIds: new Set(['n1'])
    })

    renderHook(() => useCanvasHotkeys())

    act(() => {
      fireKey('keydown', { key: 'Backspace' })
    })

    const { nodes } = useGraphStore.getState().graph
    expect(nodes).toHaveLength(1)
    expect(nodes[0].id).toBe('n2')
  })

  it('Ctrl+A selects all nodes', () => {
    const n1 = makeNode('n1')
    const n2 = makeNode('n2')
    const n3 = makeNode('n3')
    useGraphStore.setState({
      graph: { nodes: [n1, n2, n3], edges: [] }
    })

    renderHook(() => useCanvasHotkeys())

    act(() => {
      fireKey('keydown', { key: 'a', ctrlKey: true })
    })

    const selected = useGraphStore.getState().selectedNodeIds
    expect(selected).toEqual(new Set(['n1', 'n2', 'n3']))
  })

  it('Meta+A (Cmd) selects all nodes', () => {
    const n1 = makeNode('n1')
    const n2 = makeNode('n2')
    useGraphStore.setState({
      graph: { nodes: [n1, n2], edges: [] }
    })

    renderHook(() => useCanvasHotkeys())

    act(() => {
      fireKey('keydown', { key: 'a', metaKey: true })
    })

    const selected = useGraphStore.getState().selectedNodeIds
    expect(selected).toEqual(new Set(['n1', 'n2']))
  })

  it('Space toggles from select to pan mode', () => {
    useUIStore.setState({ canvasMode: 'select' })

    renderHook(() => useCanvasHotkeys())

    act(() => {
      fireKey('keydown', { key: ' ' })
    })

    expect(useUIStore.getState().canvasMode).toBe('pan')
  })

  it('Space keyup restores previous mode', () => {
    useUIStore.setState({ canvasMode: 'select' })

    renderHook(() => useCanvasHotkeys())

    act(() => {
      fireKey('keydown', { key: ' ' })
    })

    expect(useUIStore.getState().canvasMode).toBe('pan')

    act(() => {
      fireKey('keyup', { key: ' ' })
    })

    expect(useUIStore.getState().canvasMode).toBe('select')
  })

  it('ignores hotkeys when target is an INPUT element', () => {
    const n1 = makeNode('n1')
    useGraphStore.setState({
      graph: { nodes: [n1], edges: [] },
      selectedNodeIds: new Set(['n1'])
    })

    renderHook(() => useCanvasHotkeys())

    const input = document.createElement('input')

    act(() => {
      fireKey('keydown', { key: 'Delete', targetElement: input })
    })

    expect(useGraphStore.getState().graph.nodes).toHaveLength(1)
  })

  it('ignores hotkeys when target is a TEXTAREA element', () => {
    const n1 = makeNode('n1')
    useGraphStore.setState({
      graph: { nodes: [n1], edges: [] },
      selectedNodeIds: new Set(['n1'])
    })

    renderHook(() => useCanvasHotkeys())

    const textarea = document.createElement('textarea')

    act(() => {
      fireKey('keydown', { key: 'Delete', targetElement: textarea })
    })

    expect(useGraphStore.getState().graph.nodes).toHaveLength(1)
  })
})
