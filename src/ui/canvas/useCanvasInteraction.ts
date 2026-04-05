import { useCallback, useEffect, useRef, useState } from 'react'
import { GraphNode } from '@domain/graph/GraphTypes'
import { NODE_WIDTH_COMPACT } from './CanvasEdge'

type ViewTransform = {
  zoom: number
  panX: number
  panY: number
}

const MIN_ZOOM = 0.25
const MAX_ZOOM = 3
const ZOOM_STEP = 0.1
const FIT_PADDING = 60

function useCanvasInteraction(canvasRef: React.RefObject<HTMLDivElement | null>) {
  const [transform, setTransform] = useState<ViewTransform>({ zoom: 1, panX: 0, panY: 0 })
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const transformRef = useRef(transform)
  transformRef.current = transform

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

  // Native wheel listener to avoid passive event error
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      setTransform((t) => ({ ...t, zoom: clampZoom(t.zoom + delta) }))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [canvasRef])

  const onPanStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    isPanning.current = true
    panStart.current = { x: e.clientX - transformRef.current.panX, y: e.clientY - transformRef.current.panY }
  }, [])

  const onPanMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return
    setTransform((t) => ({
      ...t,
      panX: e.clientX - panStart.current.x,
      panY: e.clientY - panStart.current.y
    }))
  }, [])

  const onPanEnd = useCallback(() => {
    isPanning.current = false
  }, [])

  const fitToView = useCallback((nodes: GraphNode[], canvasWidth: number, canvasHeight: number) => {
    if (nodes.length === 0) {
      setTransform({ zoom: 1, panX: 0, panY: 0 })
      return
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const n of nodes) {
      minX = Math.min(minX, n.position.x)
      minY = Math.min(minY, n.position.y)
      maxX = Math.max(maxX, n.position.x + NODE_WIDTH_COMPACT)
      maxY = Math.max(maxY, n.position.y + 100)
    }
    const graphW = maxX - minX + FIT_PADDING * 2
    const graphH = maxY - minY + FIT_PADDING * 2
    const zoom = clampZoom(Math.min(canvasWidth / graphW, canvasHeight / graphH, 1.5))
    const panX = (canvasWidth - graphW * zoom) / 2 - (minX - FIT_PADDING) * zoom
    const panY = (canvasHeight - graphH * zoom) / 2 - (minY - FIT_PADDING) * zoom
    setTransform({ zoom, panX, panY })
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        setTransform((t) => ({ ...t, zoom: clampZoom(t.zoom + ZOOM_STEP) }))
      } else if (e.key === '-') {
        e.preventDefault()
        setTransform((t) => ({ ...t, zoom: clampZoom(t.zoom - ZOOM_STEP) }))
      } else if (e.key === '0') {
        e.preventDefault()
        setTransform({ zoom: 1, panX: 0, panY: 0 })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return { transform, onPanStart, onPanMove, onPanEnd, fitToView }
}

export { useCanvasInteraction }
export type { ViewTransform }
