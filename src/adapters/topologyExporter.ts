import { Graph } from '@domain/graph/GraphTypes'
import { graphToTopology } from '@domain/topology/TopologyMapper'

import type { ProjectExportOutcome } from '@/electron/electronApi'

async function saveTopology(graph: Graph): Promise<ProjectExportOutcome> {
  if (typeof window === 'undefined' || !window.electronAPI) {
    return { status: 'error', message: 'Electron API unavailable' }
  }
  const topology = JSON.stringify(graphToTopology(graph), null, 2)
  return window.electronAPI.project.export({ topology })
}

export { saveTopology }
