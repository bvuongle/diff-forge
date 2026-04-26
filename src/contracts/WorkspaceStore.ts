import type { WorkspaceInvalidReason, WorkspaceStatus } from '@core/workspace/WorkspaceTypes'

type TopologyExportOutcome =
  | { status: 'saved'; topologyPath: string; name: string }
  | { status: 'invalidWorkspace'; reason: WorkspaceInvalidReason }
  | { status: 'error'; message: string }

type TopologyLoadOutcome =
  | { status: 'loaded'; topology: string; topologyPath: string }
  | { status: 'notFound' }
  | { status: 'error'; message: string }

type OpenWorkspaceOutcome =
  | { status: 'opened'; workspace: WorkspaceStatus }
  | { status: 'canceled' }
  | { status: 'error'; message: string }

type WorkspaceStore = {
  getStatus(): Promise<WorkspaceStatus>
  openPicker(): Promise<OpenWorkspaceOutcome>
  openAtPath(target: string): Promise<OpenWorkspaceOutcome>
  saveTopology(topology: string): Promise<TopologyExportOutcome>
  loadTopology(): Promise<TopologyLoadOutcome>
}

export type { WorkspaceStore, TopologyExportOutcome, TopologyLoadOutcome, OpenWorkspaceOutcome }
