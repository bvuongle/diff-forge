import { Topology } from '@domain/topology/TopologyTypes'
import { TopologyExporter } from '@ports/TopologyExporter'

type JsonTopologyExporterDeps = {
  saveFile(path: string, content: string): Promise<void>
}

function createJsonTopologyExporter(deps: JsonTopologyExporterDeps): TopologyExporter {
  return {
    async export(topology: Topology): Promise<void> {
      const json = JSON.stringify(topology, null, 2)
      await deps.saveFile('topology.json', json)
    },

    async exportToString(topology: Topology): Promise<string> {
      return JSON.stringify(topology, null, 2)
    }
  }
}

export { createJsonTopologyExporter }
