import { useEffect } from 'react'

import { exportTopology, requestWorkspaceSwitch } from '@state/topologyCommands'

function useAppHotkeys(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (!event.ctrlKey) return
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
