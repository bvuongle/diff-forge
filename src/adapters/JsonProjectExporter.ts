import { Graph } from '@domain/graph/GraphTypes'
import { graphToTopology } from '@domain/topology/TopologyMapper'
import { ProjectExporter, ProjectExportOutcome } from '@contracts/ProjectExporter'

type ProjectPayload = {
  topology: string
}

type JsonProjectExporterDeps = {
  saveProject(payload: ProjectPayload): Promise<ProjectExportOutcome>
}

function createJsonProjectExporter(deps: JsonProjectExporterDeps): ProjectExporter {
  return {
    async export(graph: Graph): Promise<ProjectExportOutcome> {
      const topology = JSON.stringify(graphToTopology(graph), null, 2)
      return deps.saveProject({ topology })
    }
  }
}

export { createJsonProjectExporter }
export type { ProjectPayload, JsonProjectExporterDeps }
