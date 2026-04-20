import type { ProjectExportOutcome } from '../contracts/ProjectExporter'
import type { WorkspaceStatus } from '../domain/workspace/WorkspaceTypes'

type ProjectLoadOutcome =
  | { status: 'loaded'; topology: string; topologyPath: string }
  | { status: 'notFound' }
  | { status: 'error'; message: string }

type ProjectPayload = { topology: string }

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
  project: {
    export: (payload: ProjectPayload) => Promise<ProjectExportOutcome>
    load: () => Promise<ProjectLoadOutcome>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export type { ElectronAPI, ProjectLoadOutcome, ProjectPayload, OpenWorkspaceOutcome }
