import type { ProjectExportOutcome } from '@contracts/ProjectExporter'

import type { ProjectPayload } from './JsonProjectExporter'

async function saveProjectViaElectron(payload: ProjectPayload): Promise<ProjectExportOutcome> {
  if (typeof window === 'undefined' || !window.electronAPI) {
    return { status: 'error', message: 'Electron API unavailable' }
  }
  return window.electronAPI.project.export(payload)
}

export { saveProjectViaElectron }
