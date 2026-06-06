import type { WorkspaceStatus } from '@core/workspace/WorkspaceTypes'

import type { CatalogLoadResult } from './CatalogSource'
import type { OpenWorkspaceResult, TopologyExportResult, TopologyLoadResult } from './WorkspaceStore'

type HostApi = {
  workspace: {
    status: () => Promise<WorkspaceStatus>
    openAtPath: (payload: { path: string }) => Promise<OpenWorkspaceResult>
  }
  dialog: {
    openWorkspace: () => Promise<OpenWorkspaceResult>
  }
  topology: {
    export: (payload: { topology: string }) => Promise<TopologyExportResult>
    load: () => Promise<TopologyLoadResult>
  }
  catalog: {
    load: () => Promise<CatalogLoadResult>
  }
}

declare global {
  interface Window {
    electronAPI: HostApi
  }
}

export type { HostApi }
