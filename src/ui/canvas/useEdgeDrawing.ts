import { useCallback, useRef, useState } from 'react'
import { useGraphStore } from '@state/graphStore'

type DragEdge = {
  sourceNodeId: string
  sourceSlot: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

function useEdgeDrawing(canvasRef: React.RefObject<HTMLDivElement | null>, zoom: number, panX: number, panY: number) {
  const [dragEdge, setDragEdge] = useState<DragEdge | null>(null)
  const addEdge = useGraphStore((s) => s.addEdge)
  const dragRef = useRef<DragEdge | null>(null)

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      return {
        x: (clientX - rect.left - panX) / zoom,
        y: (clientY - rect.top - panY) / zoom
      }
    },
    [canvasRef, zoom, panX, panY]
  )

  const onPortMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string, slotName: string, portEl: HTMLElement) => {
      e.stopPropagation()
      e.preventDefault()

      const rect = portEl.getBoundingClientRect()
      const canvasRect = canvasRef.current?.getBoundingClientRect()
      if (!canvasRect) return

      const fromX = (rect.left + rect.width / 2 - canvasRect.left - panX) / zoom
      const fromY = (rect.top + rect.height / 2 - canvasRect.top - panY) / zoom

      const edge: DragEdge = {
        sourceNodeId: nodeId,
        sourceSlot: slotName,
        fromX,
        fromY,
        toX: fromX,
        toY: fromY
      }
      dragRef.current = edge
      setDragEdge(edge)

      const onMove = (me: MouseEvent) => {
        const pos = screenToCanvas(me.clientX, me.clientY)
        const updated = { ...dragRef.current!, toX: pos.x, toY: pos.y }
        dragRef.current = updated
        setDragEdge(updated)
      }

      const onUp = (ue: MouseEvent) => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)

        const el = document.elementFromPoint(ue.clientX, ue.clientY)
        const handle = el?.closest('[data-port-handle]')

        if (handle && dragRef.current) {
          const targetNodeId = handle.getAttribute('data-node-id')
          const targetSlot = handle.getAttribute('data-slot-name')
          const targetDir = handle.getAttribute('data-direction')
          const sourceDir = handle.getAttribute('data-direction') === 'in' ? 'out' : 'in'

          // We started from output, target must be input (or vice versa)
          if (
            targetNodeId &&
            targetSlot &&
            targetDir &&
            targetNodeId !== dragRef.current.sourceNodeId
          ) {
            const src = dragRef.current
            // Determine which is source (out) and which is target (in)
            const isSourceOutput = targetDir === 'in'
            const edgeId = `${isSourceOutput ? src.sourceNodeId : targetNodeId}:${isSourceOutput ? src.sourceSlot : targetSlot}->${isSourceOutput ? targetNodeId : src.sourceNodeId}:${isSourceOutput ? targetSlot : src.sourceSlot}`

            addEdge({
              id: edgeId,
              sourceNodeId: isSourceOutput ? src.sourceNodeId : targetNodeId,
              sourceSlot: isSourceOutput ? src.sourceSlot : targetSlot,
              targetNodeId: isSourceOutput ? targetNodeId : src.sourceNodeId,
              targetSlot: isSourceOutput ? targetSlot : src.sourceSlot
            })
          }
        }

        dragRef.current = null
        setDragEdge(null)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [canvasRef, zoom, panX, panY, addEdge, screenToCanvas]
  )

  return { dragEdge, onPortMouseDown }
}

export { useEdgeDrawing }
export type { DragEdge }
