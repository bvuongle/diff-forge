import { Graph } from '@core/graph/GraphTypes'
import { graphToTopology } from '@core/topology/TopologyMapper'

import type { TopologyExportOutcome } from '@/electron/electronApi'

async function saveTopology(graph: Graph): Promise<TopologyExportOutcome> {
  if (typeof window === 'undefined' || !window.electronAPI) {
    return { status: 'error', message: 'Electron API unavailable' }
  }
  const topology = JSON.stringify(graphToTopology(graph), null, 2)
  return window.electronAPI.topology.export({ topology })
}

export { saveTopology }
