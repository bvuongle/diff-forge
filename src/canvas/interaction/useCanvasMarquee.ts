import { useCallback, useState } from 'react'

import { GraphNode } from '@domain/graph/GraphTypes'

import { NODE_WIDTH_COMPACT } from '../canvasConstants'

export type MarqueeRect = { startX: number; startY: number; endX: number; endY: number }

export function useCanvasMarquee(
  canvasRef: React.RefObject<HTMLDivElement | null>,
  transform: { zoom: number; panX: number; panY: number },
  nodes: GraphNode[],
  selectNodes: (ids: string[]) => void,
  clearSelection: () => void
) {
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null)

  const startMarquee = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = (e.clientX - rect.left - transform.panX) / transform.zoom
      const y = (e.clientY - rect.top - transform.panY) / transform.zoom
      setMarquee({ startX: x, startY: y, endX: x, endY: y })
    },
    [canvasRef, transform]
  )

  const updateMarquee = useCallback(
    (e: React.MouseEvent) => {
      if (!marquee) return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = (e.clientX - rect.left - transform.panX) / transform.zoom
      const y = (e.clientY - rect.top - transform.panY) / transform.zoom
      setMarquee((prev) => (prev ? { ...prev, endX: x, endY: y } : null))
    },
    [marquee, canvasRef, transform]
  )

  const endMarquee = useCallback(() => {
    if (!marquee) return

    const left = Math.min(marquee.startX, marquee.endX)
    const right = Math.max(marquee.startX, marquee.endX)
    const top = Math.min(marquee.startY, marquee.endY)
    const bottom = Math.max(marquee.startY, marquee.endY)
    const width = right - left
    const height = bottom - top

    if (width > 5 || height > 5) {
      const enclosed = nodes
        .filter(
          (n) =>
            n.position.x >= left &&
            n.position.x + NODE_WIDTH_COMPACT <= right &&
            n.position.y >= top &&
            n.position.y + 60 <= bottom
        )
        .map((n) => n.id)
      selectNodes(enclosed)
    } else {
      clearSelection()
    }
    setMarquee(null)
  }, [marquee, nodes, selectNodes, clearSelection])

  return { marquee, startMarquee, updateMarquee, endMarquee, setMarquee }
}
