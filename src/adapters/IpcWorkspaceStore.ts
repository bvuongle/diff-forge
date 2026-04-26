import type { WorkspaceStatus } from '@core/workspace/WorkspaceTypes'
import type { WorkspaceStore } from '@contracts/WorkspaceStore'

const FALLBACK_STATUS: WorkspaceStatus = { valid: false, reason: 'empty', cwd: '' }
const BRIDGE_UNAVAILABLE = 'Electron bridge unavailable - run `pnpm dev` from the diff-forge folder.'

function bridgeMissing(): boolean {
  return typeof window === 'undefined' || !window.electronAPI
}

function createIpcWorkspaceStore(): WorkspaceStore {
  return {
    async getStatus() {
      if (bridgeMissing()) return FALLBACK_STATUS
      return window.electronAPI.workspace.status()
    },
    async openPicker() {
      if (bridgeMissing()) return { status: 'error', message: BRIDGE_UNAVAILABLE }
      return window.electronAPI.dialog.openWorkspace()
    },
    async openAtPath(target) {
      if (bridgeMissing()) return { status: 'error', message: BRIDGE_UNAVAILABLE }
      return window.electronAPI.workspace.openAtPath({ path: target })
    },
    async saveTopology(topology) {
      if (bridgeMissing()) return { status: 'error', message: BRIDGE_UNAVAILABLE }
      return window.electronAPI.topology.export({ topology })
    },
    async loadTopology() {
      if (bridgeMissing()) return { status: 'error', message: BRIDGE_UNAVAILABLE }
      return window.electronAPI.topology.load()
    }
  }
}

const ipcWorkspaceStore = createIpcWorkspaceStore()

export { createIpcWorkspaceStore, ipcWorkspaceStore }
