import { useCallback } from 'react'

import { CatalogComponentZ } from '@domain/catalog/CatalogSchema'
import { GraphNode } from '@domain/graph/GraphTypes'

import { NODE_WIDTH_COMPACT } from '../canvasConstants'
import { createNodeFromCatalog } from '../nodes/createNodeFromCatalog'

export function useCanvasDnD(
  canvasRef: React.RefObject<HTMLDivElement | null>,
  transform: { zoom: number; panX: number; panY: number },
  nodes: GraphNode[],
  addNode: (node: GraphNode) => void
) {
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
      const component = parsed.data
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const position = {
        x: (e.clientX - rect.left - transform.panX) / transform.zoom - NODE_WIDTH_COMPACT / 2,
        y: (e.clientY - rect.top - transform.panY) / transform.zoom - 30
      }
      const node = createNodeFromCatalog(component, position, nodes)
      addNode(node)
    },
    [transform, nodes, addNode, canvasRef]
  )

  return { onDragOver, onDrop }
}
