import { useCallback, useEffect, useRef, useState } from 'react'

type ViewTransform = {
  zoom: number
  panX: number
  panY: number
}

const MIN_ZOOM = 0.25
const MAX_ZOOM = 3
const ZOOM_STEP = 0.1

function useCanvasInteraction() {
  const [transform, setTransform] = useState<ViewTransform>({
    zoom: 1,
    panX: 0,
    panY: 0
  })
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const transformRef = useRef(transform)
  transformRef.current = transform

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

  const zoomIn = useCallback(() => {
    setTransform((t) => ({ ...t, zoom: clampZoom(t.zoom + ZOOM_STEP) }))
  }, [])

  const zoomOut = useCallback(() => {
    setTransform((t) => ({ ...t, zoom: clampZoom(t.zoom - ZOOM_STEP) }))
  }, [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    setTransform((t) => ({ ...t, zoom: clampZoom(t.zoom + delta) }))
  }, [])

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return

      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        zoomIn()
      } else if (e.key === '-') {
        e.preventDefault()
        zoomOut()
      } else if (e.key === '0') {
        e.preventDefault()
        setTransform({ zoom: 1, panX: 0, panY: 0 })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [zoomIn, zoomOut])

  return {
    transform,
    onWheel,
    onPanStart,
    onPanMove,
    onPanEnd
  }
}

export { useCanvasInteraction }
export type { ViewTransform }
