import { useCallback } from 'react'

import { useReactFlow } from '@xyflow/react'

import { CatalogComponentZ } from '@domain/catalog/CatalogSchema'
import { useGraphStore } from '@state/graphStore'
import { NODE_DROP_OFFSET_Y, NODE_MIN_WIDTH_COMPACT } from '@canvas/canvasConstants'
import { createNodeFromCatalog } from '@canvas/nodes/createNodeFromCatalog'

export function useCatalogDrop() {
  const { screenToFlowPosition } = useReactFlow()
  const nodes = useGraphStore((s) => s.graph.nodes)
  const addNode = useGraphStore((s) => s.addNode)
  const clearSelection = useGraphStore((s) => s.clearSelection)

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-diff-component')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData('application/x-diff-component')
      if (!raw) return
      const parsed = CatalogComponentZ.safeParse(JSON.parse(raw))
      if (!parsed.success) return
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      position.x -= NODE_MIN_WIDTH_COMPACT / 2
      position.y -= NODE_DROP_OFFSET_Y
      const node = createNodeFromCatalog(parsed.data, position, nodes)
      addNode(node)
      clearSelection()
    },
    [screenToFlowPosition, nodes, addNode, clearSelection]
  )

  return { onDragOver, onDrop }
}
