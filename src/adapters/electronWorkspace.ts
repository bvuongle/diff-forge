import { WorkspaceStatus } from '@domain/workspace/WorkspaceTypes'

type OpenWorkspaceResult =
  | { status: 'opened'; workspace: WorkspaceStatus }
  | { status: 'canceled' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string }

async function getWorkspaceStatus(): Promise<WorkspaceStatus> {
  if (typeof window === 'undefined' || !window.electronAPI) {
    return { valid: false, reason: 'empty', cwd: '' }
  }
  return window.electronAPI.workspace.status()
}

async function openWorkspacePicker(): Promise<OpenWorkspaceResult> {
  if (typeof window === 'undefined' || !window.electronAPI) {
    return { status: 'unavailable' }
  }
  return window.electronAPI.dialog.openWorkspace()
}

async function openWorkspaceAtPath(target: string): Promise<OpenWorkspaceResult> {
  if (typeof window === 'undefined' || !window.electronAPI) {
    return { status: 'unavailable' }
  }
  return window.electronAPI.workspace.openAtPath({ path: target })
}

export { getWorkspaceStatus, openWorkspacePicker, openWorkspaceAtPath }
export type { OpenWorkspaceResult }
