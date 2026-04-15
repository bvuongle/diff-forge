import { useCallback, useRef, useState } from 'react'

import { validateEdge } from '@domain/graph/GraphOperations'
import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'

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
  const graph = useGraphStore((s) => s.graph)
  const setDragInfo = useUIStore((s) => s.setDragInfo)
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

      const node = graph.nodes.find((n) => n.id === nodeId)
      if (node) {
        const outInterfaces = node.slots.filter((s) => s.direction === 'out').map((s) => s.interface)
        setDragInfo({ sourceNodeId: nodeId, sourceInterfaces: outInterfaces })
      }

      const edge: DragEdge = { sourceNodeId: nodeId, sourceSlot: slotName, fromX, fromY, toX: fromX, toY: fromY }
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
        setDragInfo(null)

        const el = document.elementFromPoint(ue.clientX, ue.clientY)
        const handle = el?.closest('[data-port-handle]')

        if (handle && dragRef.current) {
          const targetNodeId = handle.getAttribute('data-node-id')
          const targetSlot = handle.getAttribute('data-slot-name')
          const targetDir = handle.getAttribute('data-direction')

          if (targetNodeId && targetSlot && targetDir && targetNodeId !== dragRef.current.sourceNodeId) {
            const src = dragRef.current
            const isSourceOutput = targetDir === 'in'

            const sNodeId = isSourceOutput ? src.sourceNodeId : targetNodeId
            let sSlot = isSourceOutput ? src.sourceSlot : targetSlot
            const tNodeId = isSourceOutput ? targetNodeId : src.sourceNodeId
            const tSlot = isSourceOutput ? targetSlot : src.sourceSlot

            if (sSlot === '__out__') {
              const srcNode = graph.nodes.find((n) => n.id === sNodeId)
              const tgtNode = graph.nodes.find((n) => n.id === tNodeId)
              const tgtSlotObj = tgtNode?.slots.find((s) => s.name === tSlot && s.direction === 'in')
              const matchingOut = srcNode?.slots.find(
                (s) => s.direction === 'out' && s.interface === tgtSlotObj?.interface
              )
              if (matchingOut) sSlot = matchingOut.name
            }

            const validation = validateEdge(graph, sNodeId, sSlot, tNodeId, tSlot)
            if (validation.valid) {
              addEdge({
                id: `${sNodeId}:${sSlot}->${tNodeId}:${tSlot}`,
                sourceNodeId: sNodeId,
                sourceSlot: sSlot,
                targetNodeId: tNodeId,
                targetSlot: tSlot
              })
            }
          }
        }

        dragRef.current = null
        setDragEdge(null)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [canvasRef, zoom, panX, panY, addEdge, graph, screenToCanvas, setDragInfo]
  )

  return { dragEdge, onPortMouseDown }
}

export { useEdgeDrawing }
