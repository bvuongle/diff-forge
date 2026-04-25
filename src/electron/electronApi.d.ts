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

type RepoFetchStateDto = { status: 'ok' } | { status: 'failed'; reason: string }

type RepoSummaryDto = {
  url: string
  state: RepoFetchStateDto
}

type CatalogLoadOutcome =
  | { status: 'unconfigured'; missing: string[] }
  | { status: 'ready'; catalog: string; repos: RepoSummaryDto[] }
  | { status: 'partial'; catalog: string; repos: RepoSummaryDto[]; message: string }
  | { status: 'error'; message: string; repos: RepoSummaryDto[] }

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
  catalog: {
    load: () => Promise<CatalogLoadOutcome>
    refresh: () => Promise<CatalogLoadOutcome>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export type {
  ElectronAPI,
  TopologyExportOutcome,
  TopologyLoadOutcome,
  TopologyPayload,
  OpenWorkspaceOutcome,
  CatalogLoadOutcome,
  RepoSummaryDto,
  RepoFetchStateDto
}
