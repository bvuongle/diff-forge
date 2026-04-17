import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useGraphStore } from '@state/graphStore'
import { NODE_DROP_OFFSET_Y, NODE_MIN_WIDTH_COMPACT } from '@canvas/canvasConstants'

import { useCatalogDrop } from './useCatalogDrop'

vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({
    screenToFlowPosition: ({ x, y }: { x: number; y: number }) => ({ x, y })
  })
}))

const VALID_CATALOG = {
  type: 'LinkEth',
  source: 'diff_broker',
  version: '1.0.0',
  implements: ['ILink'],
  requires: [{ slot: 'transport', interface: 'ITransport', min: 1, max: 1, order: 0 }],
  configSchema: {}
}

function makeDragEvent(type: string, data?: Record<string, string>, clientX = 500, clientY = 300): React.DragEvent {
  const types = data ? Object.keys(data) : []
  return {
    preventDefault: vi.fn(),
    clientX,
    clientY,
    dataTransfer: {
      types,
      dropEffect: 'none',
      getData: (key: string) => data?.[key] ?? ''
    }
  } as unknown as React.DragEvent
}

describe('useCatalogDrop', () => {
  beforeEach(() => {
    useGraphStore.setState({ graph: { nodes: [], edges: [] } })
  })

  describe('onDragOver', () => {
    it('sets dropEffect to copy for application/x-diff-component MIME', () => {
      const { result } = renderHook(() => useCatalogDrop())
      const event = makeDragEvent('dragover', {
        'application/x-diff-component': ''
      })

      result.current.onDragOver(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.dataTransfer.dropEffect).toBe('copy')
    })

    it('does not preventDefault for unrecognized MIME type', () => {
      const { result } = renderHook(() => useCatalogDrop())
      const event = makeDragEvent('dragover', { 'text/plain': 'hello' })

      result.current.onDragOver(event)

      expect(event.preventDefault).not.toHaveBeenCalled()
      expect(event.dataTransfer.dropEffect).toBe('none')
    })
  })

  describe('onDrop', () => {
    it('creates node at adjusted position', () => {
      const { result } = renderHook(() => useCatalogDrop())
      const event = makeDragEvent('drop', {
        'application/x-diff-component': JSON.stringify(VALID_CATALOG)
      })

      result.current.onDrop(event)

      const nodes = useGraphStore.getState().graph.nodes
      expect(nodes).toHaveLength(1)
      expect(nodes[0].position.x).toBe(500 - NODE_MIN_WIDTH_COMPACT / 2)
      expect(nodes[0].position.y).toBe(300 - NODE_DROP_OFFSET_Y)
    })

    it('selects the new node after creation', () => {
      const { result } = renderHook(() => useCatalogDrop())
      const event = makeDragEvent('drop', {
        'application/x-diff-component': JSON.stringify(VALID_CATALOG)
      })

      result.current.onDrop(event)

      const nodes = useGraphStore.getState().graph.nodes
      const selectedIds = useGraphStore.getState().selectedNodeIds
      expect(selectedIds).toContain(nodes[0].id)
    })

    it('does nothing for empty dataTransfer', () => {
      const { result } = renderHook(() => useCatalogDrop())
      const event = makeDragEvent('drop', {
        'application/x-diff-component': ''
      })

      result.current.onDrop(event)

      const nodes = useGraphStore.getState().graph.nodes
      expect(nodes).toHaveLength(0)
    })

    it('does nothing for invalid catalog data', () => {
      const { result } = renderHook(() => useCatalogDrop())
      const event = makeDragEvent('drop', {
        'application/x-diff-component': JSON.stringify({ invalid: true })
      })

      result.current.onDrop(event)

      const nodes = useGraphStore.getState().graph.nodes
      expect(nodes).toHaveLength(0)
    })
  })
})
