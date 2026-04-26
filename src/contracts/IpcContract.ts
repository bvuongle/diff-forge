import type { WorkspaceStatus } from '@core/workspace/WorkspaceTypes'

import type { CatalogLoadOutcome } from './CatalogSource'
import type { OpenWorkspaceOutcome, TopologyExportOutcome, TopologyLoadOutcome } from './WorkspaceStore'

type HostApi = {
  workspace: {
    status: () => Promise<WorkspaceStatus>
    openAtPath: (payload: { path: string }) => Promise<OpenWorkspaceOutcome>
  }
  dialog: {
    openWorkspace: () => Promise<OpenWorkspaceOutcome>
  }
  topology: {
    export: (payload: { topology: string }) => Promise<TopologyExportOutcome>
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

export type { HostApi }
