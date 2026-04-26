import { fireEvent, screen } from '@testing-library/react'
import { ReactFlowProvider, type NodeProps } from '@xyflow/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CatalogDocument } from '@core/catalog/CatalogSchema'
import { useCatalogStore } from '@state/catalogStore'
import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'
import type { CanvasNode as CanvasNodeType } from '@canvas/canvasTypes'
import { makeNode } from '@testing/fixtures'
import { renderWithTheme } from '@testing/test-utils'

import { CanvasNode } from './CanvasNode'

vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    useConnection: () => ({ inProgress: false }),
    Handle: ({ children, id }: { children?: React.ReactNode; id?: string }) => (
      <div data-testid={`handle-${id}`}>{children}</div>
    )
  }
})

describe('CanvasNode', () => {
  const node = makeNode('n1', {
    componentType: 'TestType',
    instanceId: 'testInst',
    version: '1.0.0',
    source: 'test.cpp'
  })
  const catalog = {
    version: '1.0.0',
    components: [
      {
        type: 'TestType',
        version: '1.0.0',
        source: 'test.cpp',
        implements: [],
        requires: [],
        configSchema: {}
      }
    ]
  }

  beforeEach(() => {
    useGraphStore.setState({
      graph: { nodes: [node], edges: [] },
      selectedNodeIds: new Set(),
      selectedEdgeIds: new Set()
    })
    useUIStore.setState({
      expandedNodeIds: new Set()
    })
    useCatalogStore.setState({
      catalog: catalog as unknown as CatalogDocument
    })
  })

  const defaultProps: NodeProps<CanvasNodeType> = {
    id: 'n1',
    selected: false,
    data: { graphNode: node },
    zIndex: 0,
    isConnectable: true,
    xPos: 0,
    yPos: 0,
    dragging: false
  } as unknown as NodeProps<CanvasNodeType>

  it('renders component type and instance id', () => {
    renderWithTheme(
      <ReactFlowProvider>
        <CanvasNode {...defaultProps} />
      </ReactFlowProvider>
    )
    expect(screen.getByText('TestType')).toBeInTheDocument()
    expect(screen.getByText('testInst')).toBeInTheDocument()
  })

  it('toggles expansion on icon click', () => {
    const toggleNodeExpanded = vi.spyOn(useUIStore.getState(), 'toggleNodeExpanded')

    renderWithTheme(
      <ReactFlowProvider>
        <CanvasNode {...defaultProps} />
      </ReactFlowProvider>
    )

    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    expect(toggleNodeExpanded).toHaveBeenCalledWith('n1')
  })

  it('renders expanded content when expanded', () => {
    useUIStore.setState({ expandedNodeIds: new Set(['n1']) })

    renderWithTheme(
      <ReactFlowProvider>
        <CanvasNode {...defaultProps} />
      </ReactFlowProvider>
    )

    expect(screen.getByText('REQUIREMENTS')).toBeInTheDocument()
    expect(screen.getByText('INFO')).toBeInTheDocument()
  })

  it('applies dimmed opacity when unrelated node is selected', () => {
    useGraphStore.setState({
      graph: { nodes: [node, makeNode('n2')], edges: [] },
      selectedNodeIds: new Set(['n2'])
    })

    const { container } = renderWithTheme(
      <ReactFlowProvider>
        <CanvasNode {...defaultProps} />
      </ReactFlowProvider>
    )

    expect(container.firstChild).toHaveClass('canvas-node--dimmed')
  })
})
