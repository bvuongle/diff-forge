import { fireEvent, screen } from '@testing-library/react'
import { makeNode } from '@testing/fixtures'
import { renderWithTheme } from '@testing/test-utils'
import { ReactFlowProvider } from '@xyflow/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'

import { CanvasToolkit } from './CanvasToolkit'

vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    useReactFlow: () => ({ getNodes: () => [] }),
    Controls: ({ children }: { children: React.ReactNode }) => <div data-testid="controls">{children}</div>,
    ControlButton: ({
      children,
      onClick,
      style
    }: {
      children: React.ReactNode
      onClick?: () => void
      style?: React.CSSProperties
    }) => (
      <button onClick={onClick} style={style}>
        {children}
      </button>
    )
  }
})

vi.mock('html-to-image', () => ({
  toPng: vi.fn()
}))

describe('CanvasToolkit', () => {
  beforeEach(() => {
    useUIStore.setState({ canvasMode: 'select', snapToGrid: false, expandedNodeIds: new Set() })
    useGraphStore.setState({ graph: { nodes: [], edges: [] } })
  })

  it('renders select and pan mode buttons', () => {
    renderWithTheme(
      <ReactFlowProvider>
        <CanvasToolkit />
      </ReactFlowProvider>
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(6)
  })

  it('switches to pan mode on pan button click', () => {
    renderWithTheme(
      <ReactFlowProvider>
        <CanvasToolkit />
      </ReactFlowProvider>
    )
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[1])
    expect(useUIStore.getState().canvasMode).toBe('pan')
  })

  it('toggles snap to grid', () => {
    renderWithTheme(
      <ReactFlowProvider>
        <CanvasToolkit />
      </ReactFlowProvider>
    )
    const buttons = screen.getAllByRole('button')
    const snapButton = buttons[4]
    fireEvent.click(snapButton)
    expect(useUIStore.getState().snapToGrid).toBe(true)
  })

  it('expands all nodes', () => {
    useGraphStore.setState({ graph: { nodes: [makeNode('n1'), makeNode('n2')], edges: [] } })

    renderWithTheme(
      <ReactFlowProvider>
        <CanvasToolkit />
      </ReactFlowProvider>
    )
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[2])
    const expanded = useUIStore.getState().expandedNodeIds
    expect(expanded.has('n1')).toBe(true)
    expect(expanded.has('n2')).toBe(true)
  })

  it('collapses all nodes', () => {
    useUIStore.setState({ expandedNodeIds: new Set(['n1', 'n2']) })

    renderWithTheme(
      <ReactFlowProvider>
        <CanvasToolkit />
      </ReactFlowProvider>
    )
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[3])
    expect(useUIStore.getState().expandedNodeIds.size).toBe(0)
  })
})
