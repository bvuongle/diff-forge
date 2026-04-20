import type { WorkspaceInvalidReason, WorkspaceStatus } from '../domain/workspace/WorkspaceTypes'

type TopologyExportOutcome =
  | { status: 'saved'; topologyPath: string; projectName: string }
  | { status: 'invalidWorkspace'; reason: WorkspaceInvalidReason }
  | { status: 'error'; message: string }

type TopologyLoadOutcome =
  | { status: 'loaded'; topology: string; topologyPath: string }
  | { status: 'notFound' }
  | { status: 'error'; message: string }

type TopologyPayload = { topology: string }

type OpenWorkspaceOutcome =
  | { status: 'opened'; workspace: WorkspaceStatus }
  | { status: 'canceled' }
  | { status: 'error'; message: string }

type ElectronAPI = {
  workspace: {
    status: () => Promise<WorkspaceStatus>
    openAtPath: (payload: { path: string }) => Promise<OpenWorkspaceOutcome>
  }
  dialog: {
    openWorkspace: () => Promise<OpenWorkspaceOutcome>
  }
  topology: {
    export: (payload: TopologyPayload) => Promise<TopologyExportOutcome>
    load: () => Promise<TopologyLoadOutcome>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export type { ElectronAPI, TopologyExportOutcome, TopologyLoadOutcome, TopologyPayload, OpenWorkspaceOutcome }
