import { screen } from '@testing-library/react'
import { Position, ReactFlowProvider, type EdgeProps } from '@xyflow/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { GraphEdge, GraphNode } from '@core/graph/GraphTypes'
import { useGraphStore } from '@state/graphStore'
import type { CanvasEdge as CanvasEdgeType } from '@canvas/canvasTypes'
import { makeNode } from '@testing/fixtures'
import { renderWithTheme } from '@testing/test-utils'

import { CanvasEdge } from './CanvasEdge'

vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    BaseEdge: ({ style, markerEnd }: { style?: React.CSSProperties; markerEnd?: string }) => (
      <div data-testid="base-edge" style={style} data-marker={markerEnd} />
    ),
    EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="edge-label-renderer">{children}</div>
    )
  }
})

describe('CanvasEdge', () => {
  const edge: GraphEdge = {
    id: 'e1',
    sourceNodeId: 'n1',
    sourceSlot: 'out1',
    targetNodeId: 'n2',
    targetSlot: 'in1'
  }

  const nodes: GraphNode[] = [
    makeNode('n1', { slots: [{ name: 'out1', direction: 'out', interface: 'I1', maxConnections: Infinity }] }),
    makeNode('n2', { slots: [{ name: 'in1', direction: 'in', interface: 'I1', maxConnections: 1 }] })
  ]

  beforeEach(() => {
    useGraphStore.setState({
      graph: { nodes, edges: [edge] },
      selectedNodeIds: new Set(),
      selectedEdgeIds: new Set()
    })
  })

  const defaultProps: EdgeProps<CanvasEdgeType> = {
    id: 'e1',
    sourceX: 0,
    sourceY: 0,
    targetX: 100,
    targetY: 100,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    selected: false,
    data: { graphEdge: edge }
  } as unknown as EdgeProps<CanvasEdgeType>

  it('renders a base edge with default color', () => {
    renderWithTheme(
      <ReactFlowProvider>
        <svg>
          <CanvasEdge {...defaultProps} />
        </svg>
      </ReactFlowProvider>
    )
    const baseEdge = screen.getByTestId('base-edge')
    expect(baseEdge.style.stroke).toBe('var(--edge-default)')
  })

  it('renders with accent color when selected', () => {
    renderWithTheme(
      <ReactFlowProvider>
        <svg>
          <CanvasEdge {...defaultProps} selected={true} />
        </svg>
      </ReactFlowProvider>
    )
    const baseEdge = screen.getByTestId('base-edge')
    expect(baseEdge.style.stroke).toBe('var(--accent-blue)')
  })

  it('renders with error color when invalid', () => {
    useGraphStore.setState({ graph: { nodes: [nodes[0]], edges: [edge] } })

    renderWithTheme(
      <ReactFlowProvider>
        <svg>
          <CanvasEdge {...defaultProps} />
        </svg>
      </ReactFlowProvider>
    )
    const baseEdge = screen.getByTestId('base-edge')
    expect(baseEdge.style.stroke).toBe('var(--edge-invalid)')
  })

  it('shows source label only when source node has multiple outputs', () => {
    const multiOutNode = makeNode('n1', {
      slots: [
        { name: 'out1', direction: 'out', interface: 'I1', maxConnections: Infinity },
        { name: 'out2', direction: 'out', interface: 'I1', maxConnections: Infinity }
      ]
    })
    useGraphStore.setState({ graph: { nodes: [multiOutNode, nodes[1]], edges: [edge] } })

    const { rerender } = renderWithTheme(
      <ReactFlowProvider>
        <svg>
          <CanvasEdge {...defaultProps} />
        </svg>
      </ReactFlowProvider>
    )
    expect(screen.getByText('out1')).toBeInTheDocument()

    useGraphStore.setState({ graph: { nodes, edges: [edge] } })
    rerender(
      <ReactFlowProvider>
        <svg>
          <CanvasEdge {...defaultProps} />
        </svg>
      </ReactFlowProvider>
    )
    expect(screen.queryByText('out1')).toBeNull()
  })

  it('applies dimmed opacity when unrelated elements are selected', () => {
    useGraphStore.setState({
      graph: { nodes: [...nodes, makeNode('n3')], edges: [edge] },
      selectedNodeIds: new Set(['n3'])
    })

    renderWithTheme(
      <ReactFlowProvider>
        <svg>
          <CanvasEdge {...defaultProps} />
        </svg>
      </ReactFlowProvider>
    )

    const group = screen.getByTestId('edge-container')
    expect(group).toHaveAttribute('opacity', String(0.15))
  })
})
