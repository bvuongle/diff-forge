import { useEffect } from 'react'

import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'

export function useCanvasHotkeys() {
  const removeSelected = useGraphStore((s) => s.removeSelected)
  const selectElements = useGraphStore((s) => s.selectElements)
  const setCanvasMode = useUIStore((s) => s.setCanvasMode)

  useEffect(() => {
    let previousMode: 'select' | 'pan' | null = null

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        removeSelected()
      } else if ((e.code === 'KeyA' || e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        const allIds = useGraphStore.getState().graph.nodes.map((n) => n.id)
        selectElements(allIds, [])
      } else if (e.key === ' ' && !e.repeat) {
        e.preventDefault()
        const current = useUIStore.getState().canvasMode
        if (current === 'select') {
          previousMode = 'select'
          setCanvasMode('pan')
        } else {
          previousMode = 'pan'
          setCanvasMode('select')
        }
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
  }, [removeSelected, setCanvasMode, selectElements])
}
