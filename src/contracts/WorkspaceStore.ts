import type { WorkspaceInvalidReason, WorkspaceStatus } from '@core/workspace/WorkspaceTypes'

type TopologyExportResult =
  | { status: 'saved'; topologyPath: string; name: string }
  | { status: 'invalidWorkspace'; reason: WorkspaceInvalidReason }
  | { status: 'error'; message: string }

type TopologyLoadResult =
  | { status: 'loaded'; topology: string; topologyPath: string }
  | { status: 'notFound' }
  | { status: 'error'; message: string }

type OpenWorkspaceResult =
  | { status: 'opened'; workspace: WorkspaceStatus }
  | { status: 'canceled' }
  | { status: 'error'; message: string }

type WorkspaceStore = {
  getStatus(): Promise<WorkspaceStatus>
  openWorkspaceSelector(): Promise<OpenWorkspaceResult>
  openAtPath(target: string): Promise<OpenWorkspaceResult>
  saveTopology(topology: string): Promise<TopologyExportResult>
  loadTopology(): Promise<TopologyLoadResult>
}

export type { WorkspaceStore, TopologyExportResult, TopologyLoadResult, OpenWorkspaceResult }
