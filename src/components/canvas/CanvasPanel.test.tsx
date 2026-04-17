import { render, screen } from '@testing-library/react'
import { makeEdge, makeNode } from '@testing/fixtures'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'

import { CanvasPanel } from './CanvasPanel'

// Mock @xyflow/react — CanvasPanel renders ReactFlow which needs a full DOM canvas.
// We mock it to expose the key callbacks for testing.
let capturedProps: Record<string, unknown> = {}

vi.mock('@xyflow/react', () => ({
  ReactFlow: (props: Record<string, unknown>) => {
    capturedProps = props
    return <div data-testid="react-flow">{(props as { children: React.ReactNode }).children}</div>
  },
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Background: () => null,
  BackgroundVariant: { Dots: 'dots' },
  MiniMap: () => null,
  Controls: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ControlButton: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  getNodesBounds: () => ({ x: 0, y: 0, width: 100, height: 100 }),
  SelectionMode: { Partial: 'partial' },
  useConnection: () => ({ inProgress: false, fromNode: null }),
  useReactFlow: () => ({
    fitView: vi.fn(),
    setViewport: vi.fn(),
    getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
    getNodes: () => [],
    getNodesBounds: () => ({ x: 0, y: 0, width: 100, height: 100 }),
    screenToFlowPosition: ({ x, y }: { x: number; y: number }) => ({ x, y })
  }),
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
  MarkerType: { ArrowClosed: 'arrowclosed' },
  getViewportForBounds: () => ({ x: 0, y: 0, zoom: 1 })
}))

// Mock html-to-image (used by CanvasToolkit)
vi.mock('html-to-image', () => ({
  toPng: vi.fn()
}))

describe('CanvasPanel', () => {
  beforeEach(() => {
    capturedProps = {}
    useGraphStore.setState({
      graph: { nodes: [], edges: [] },
      selectedNodeIds: new Set(),
      selectedEdgeIds: new Set()
    })
    useUIStore.setState({
      canvasMode: 'select',
      snapToGrid: false,
      expandedNodeIds: new Set()
    })
  })

  it('renders ReactFlow with correct props', () => {
    render(<CanvasPanel />)
    expect(screen.getByTestId('react-flow')).toBeTruthy()
    expect(capturedProps.minZoom).toBe(0.1)
    expect(capturedProps.maxZoom).toBe(3)
    expect(capturedProps.connectionRadius).toBe(40)
    expect(capturedProps.edgesReconnectable).toBe(true)
  })

  it('shows empty canvas placeholder when no nodes exist', () => {
    render(<CanvasPanel />)
    expect(screen.getByText('Drag components from the catalog to place nodes.')).toBeTruthy()
  })

  it('hides placeholder when nodes exist', () => {
    useGraphStore.setState({
      graph: { nodes: [makeNode('n1')], edges: [] }
    })
    render(<CanvasPanel />)
    expect(screen.queryByText('Drag components from the catalog to place nodes.')).toBeNull()
  })

  it('uses select mode by default — panOnDrag restricts to right/middle click', () => {
    render(<CanvasPanel />)
    expect(capturedProps.panOnDrag).toEqual([1, 2])
    expect(capturedProps.selectionOnDrag).toBe(true)
  })

  it('uses pan mode when canvasMode is pan', () => {
    useUIStore.setState({ canvasMode: 'pan' })
    render(<CanvasPanel />)
    expect(capturedProps.panOnDrag).toBe(true)
    expect(capturedProps.selectionOnDrag).toBe(false)
  })

  it('passes snapToGrid to ReactFlow', () => {
    render(<CanvasPanel />)
    expect(capturedProps.snapToGrid).toBe(false)

    useUIStore.setState({ snapToGrid: true })
    const { unmount } = render(<CanvasPanel />)
    // Need to get the latest captured props from the re-render
    expect(capturedProps.snapToGrid).toBe(true)
    unmount()
  })

  it('syncs node position to store on drag stop', () => {
    const node = makeNode('n1', { position: { x: 100, y: 200 } })
    useGraphStore.setState({ graph: { nodes: [node], edges: [] } })
    render(<CanvasPanel />)

    const onNodeDragStop = capturedProps.onNodeDragStop as (...args: unknown[]) => void
    onNodeDragStop(new MouseEvent('mouseup'), { id: 'n1', position: { x: 300, y: 400 } }, [
      { id: 'n1', position: { x: 300, y: 400 } }
    ])

    expect(useGraphStore.getState().graph.nodes[0].position).toEqual({ x: 300, y: 400 })
  })

  it('selects node on click', () => {
    const node = makeNode('n1')
    useGraphStore.setState({ graph: { nodes: [node], edges: [] } })
    render(<CanvasPanel />)

    const onNodeClick = capturedProps.onNodeClick as (...args: unknown[]) => void
    onNodeClick(new MouseEvent('click'), { id: 'n1' })

    expect(useGraphStore.getState().selectedNodeIds.has('n1')).toBe(true)
  })

  it('selects edge on click', () => {
    const node1 = makeNode('n1')
    const node2 = makeNode('n2')
    const edge = makeEdge('e1', 'n1', 'n2')
    useGraphStore.setState({ graph: { nodes: [node1, node2], edges: [edge] } })
    render(<CanvasPanel />)

    const onEdgeClick = capturedProps.onEdgeClick as (...args: unknown[]) => void
    onEdgeClick(new MouseEvent('click'), { id: 'e1' })

    expect(useGraphStore.getState().selectedEdgeIds.has('e1')).toBe(true)
  })

  it('clears selection on pane click', () => {
    useGraphStore.setState({
      graph: { nodes: [makeNode('n1')], edges: [] },
      selectedNodeIds: new Set(['n1'])
    })
    render(<CanvasPanel />)

    const onPaneClick = capturedProps.onPaneClick as () => void
    onPaneClick()

    expect(useGraphStore.getState().selectedNodeIds.size).toBe(0)
  })

  it('removes node on node change with type remove', () => {
    const node = makeNode('n1')
    useGraphStore.setState({ graph: { nodes: [node], edges: [] } })
    render(<CanvasPanel />)

    const onNodesChange = capturedProps.onNodesChange as (changes: unknown[]) => void
    onNodesChange([{ type: 'remove', id: 'n1' }])

    expect(useGraphStore.getState().graph.nodes).toHaveLength(0)
  })

  it('removes edge on edge change with type remove', () => {
    const edge = makeEdge('e1', 'n1', 'n2')
    useGraphStore.setState({
      graph: { nodes: [makeNode('n1'), makeNode('n2')], edges: [edge] }
    })
    render(<CanvasPanel />)

    const onEdgesChange = capturedProps.onEdgesChange as (changes: unknown[]) => void
    onEdgesChange([{ type: 'remove', id: 'e1' }])

    expect(useGraphStore.getState().graph.edges).toHaveLength(0)
  })
})
