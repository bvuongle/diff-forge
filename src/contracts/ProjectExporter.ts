import { Graph } from '@domain/graph/GraphTypes'
import { WorkspaceInvalidReason } from '@domain/workspace/WorkspaceTypes'

type ProjectExportOutcome =
  | { status: 'saved'; topologyPath: string; projectName: string }
  | { status: 'invalidWorkspace'; reason: WorkspaceInvalidReason }
  | { status: 'error'; message: string }

type ProjectExporter = {
  export(graph: Graph): Promise<ProjectExportOutcome>
}

export type { ProjectExportOutcome, ProjectExporter }
