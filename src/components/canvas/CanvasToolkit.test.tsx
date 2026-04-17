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
    useReactFlow: () => ({
      getNodes: () => [],
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      zoomTo: vi.fn(),
      fitView: vi.fn()
    }),
    useStore: (selector: (s: { transform: [number, number, number] }) => unknown) => selector({ transform: [0, 0, 1] }),
    Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="panel">{children}</div>
  }
})

vi.mock('html-to-image', () => ({
  toPng: vi.fn()
}))

describe('CanvasToolkit', () => {
  beforeEach(() => {
    useUIStore.setState({
      canvasMode: 'select',
      snapToGrid: false,
      expandedNodeIds: new Set(),
      animateEdges: false
    })
    useGraphStore.setState({ graph: { nodes: [], edges: [] } })
  })

  it('renders all toolkit buttons', () => {
    renderWithTheme(
      <ReactFlowProvider>
        <CanvasToolkit />
      </ReactFlowProvider>
    )
    expect(screen.getByLabelText('Select mode')).toBeInTheDocument()
    expect(screen.getByLabelText('Pan mode')).toBeInTheDocument()
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument()
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument()
    expect(screen.getByLabelText('Fit to view')).toBeInTheDocument()
    expect(screen.getByLabelText('Toggle edge animation')).toBeInTheDocument()
  })

  it('switches to pan mode on pan button click', () => {
    renderWithTheme(
      <ReactFlowProvider>
        <CanvasToolkit />
      </ReactFlowProvider>
    )
    fireEvent.click(screen.getByLabelText('Pan mode'))
    expect(useUIStore.getState().canvasMode).toBe('pan')
  })

  it('toggles snap to grid', () => {
    renderWithTheme(
      <ReactFlowProvider>
        <CanvasToolkit />
      </ReactFlowProvider>
    )
    fireEvent.click(screen.getByLabelText('Toggle snap to grid'))
    expect(useUIStore.getState().snapToGrid).toBe(true)
  })

  it('toggles edge animation', () => {
    renderWithTheme(
      <ReactFlowProvider>
        <CanvasToolkit />
      </ReactFlowProvider>
    )
    fireEvent.click(screen.getByLabelText('Toggle edge animation'))
    expect(useUIStore.getState().animateEdges).toBe(true)
  })

  it('expands all nodes', () => {
    useGraphStore.setState({ graph: { nodes: [makeNode('n1'), makeNode('n2')], edges: [] } })
    renderWithTheme(
      <ReactFlowProvider>
        <CanvasToolkit />
      </ReactFlowProvider>
    )
    fireEvent.click(screen.getByLabelText('Expand all nodes'))
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
    fireEvent.click(screen.getByLabelText('Collapse all nodes'))
    expect(useUIStore.getState().expandedNodeIds.size).toBe(0)
  })

  it('displays current zoom as a percentage', () => {
    renderWithTheme(
      <ReactFlowProvider>
        <CanvasToolkit />
      </ReactFlowProvider>
    )
    expect(screen.getByLabelText('Zoom presets')).toHaveTextContent('100%')
  })
})
