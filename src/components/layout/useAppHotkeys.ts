import { useEffect } from 'react'

import { exportTopology, requestWorkspaceSwitch } from '@state/topologyCommands'
import { useUIStore } from '@state/uiStore'

function useAppHotkeys(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey) return
      if (event.code === 'KeyM') {
        event.preventDefault()
        useUIStore.getState().toggleSearchMode()
        return
      }
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (event.code === 'KeyS') {
        event.preventDefault()
        exportTopology()
      } else if (event.code === 'KeyO') {
        event.preventDefault()
        requestWorkspaceSwitch()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

export { useAppHotkeys }
