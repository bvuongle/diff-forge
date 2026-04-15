import { useCallback, useRef } from 'react'

import { useGraphStore } from '@state/graphStore'

function useNodeDrag(zoom: number) {
  const moveNode = useGraphStore((s) => s.moveNode)
  const graph = useGraphStore((s) => s.graph)
  const dragInfo = useRef<{ nodeId: string; startX: number; startY: number; origX: number; origY: number } | null>(null)

  const onMoveStart = useCallback(
    (nodeId: string, clientX: number, clientY: number) => {
      const node = graph.nodes.find((n) => n.id === nodeId)
      if (!node) return

      dragInfo.current = {
        nodeId,
        startX: clientX,
        startY: clientY,
        origX: node.position.x,
        origY: node.position.y
      }

      const onMove = (e: MouseEvent) => {
        if (!dragInfo.current) return
        const dx = (e.clientX - dragInfo.current.startX) / zoom
        const dy = (e.clientY - dragInfo.current.startY) / zoom
        moveNode(dragInfo.current.nodeId, {
          x: dragInfo.current.origX + dx,
          y: dragInfo.current.origY + dy
        })
      }

      const onUp = () => {
        dragInfo.current = null
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [zoom, graph.nodes, moveNode]
  )

  return { onMoveStart }
}

export { useNodeDrag }
