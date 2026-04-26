import type { WorkspaceInvalidReason, WorkspaceStatus } from '../core/workspace/WorkspaceTypes'
import type { CatalogLoadOutcome } from './CatalogSource'

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

type HostApi = {
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
  catalog: {
    load: () => Promise<CatalogLoadOutcome>
  }
}

declare global {
  interface Window {
    electronAPI: HostApi
  }
}

export type { HostApi, TopologyExportOutcome, TopologyLoadOutcome, TopologyPayload, OpenWorkspaceOutcome }
