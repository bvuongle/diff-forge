import { useEffect } from 'react'

import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'

export function useCanvasHotkeys() {
  const { selectedNodeIds, selectedEdgeId, removeSelectedNodes, removeEdge } = useGraphStore()
  const { setCanvasMode } = useUIStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.size > 0) removeSelectedNodes()
        else if (selectedEdgeId) removeEdge(selectedEdgeId)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedNodeIds, selectedEdgeId, removeSelectedNodes, removeEdge])

  useEffect(() => {
    let previousMode: 'select' | 'pan' | null = null

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'v' || e.key === 'V') setCanvasMode('select')
      else if (e.key === 'h' || e.key === 'H') setCanvasMode('pan')
      else if (e.key === ' ' && !e.repeat) {
        e.preventDefault()
        previousMode = useUIStore.getState().canvasMode
        setCanvasMode('pan')
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && previousMode !== null) {
        setCanvasMode(previousMode)
        previousMode = null
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [setCanvasMode])
}
