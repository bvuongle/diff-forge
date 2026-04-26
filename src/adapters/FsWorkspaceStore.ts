import { readFile, stat, writeFile } from 'fs/promises'
import { homedir } from 'os'
import path from 'path'

import { dialog, type BrowserWindow } from 'electron'

import { checkWorkspace } from '@core/workspace/workspaceContext'
import type {
  OpenWorkspaceOutcome,
  TopologyExportOutcome,
  TopologyLoadOutcome,
  WorkspaceStore
} from '@contracts/WorkspaceStore'

type FsWorkspaceStoreDeps = {
  getMainWindow: () => BrowserWindow | null
}

function expandTilde(target: string): string {
  if (target === '~') return homedir()
  if (target.startsWith('~/')) return path.join(homedir(), target.slice(2))
  return target
}

async function tryRead(target: string): Promise<string | null> {
  try {
    return await readFile(target, 'utf8')
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw err
  }
}

function topologyPathFor(name: string): string {
  return path.join(process.cwd(), `${name}.forge.json`)
}

function createFsWorkspaceStore(deps: FsWorkspaceStoreDeps): WorkspaceStore {
  return {
    async getStatus() {
      return checkWorkspace(process.cwd(), homedir())
    },

    async openPicker(): Promise<OpenWorkspaceOutcome> {
      const window = deps.getMainWindow()
      if (!window) return { status: 'error', message: 'Window not ready' }
      try {
        const result = await dialog.showOpenDialog(window, {
          properties: ['openDirectory'],
          title: 'Select workspace folder'
        })
        if (result.canceled || result.filePaths.length === 0) {
          return { status: 'canceled' }
        }
        process.chdir(result.filePaths[0])
        return { status: 'opened', workspace: checkWorkspace(process.cwd(), homedir()) }
      } catch (err) {
        return { status: 'error', message: err instanceof Error ? err.message : String(err) }
      }
    },

    async openAtPath(target: string): Promise<OpenWorkspaceOutcome> {
      const raw = target.trim()
      if (!raw) return { status: 'error', message: 'Path is empty' }
      const expanded = expandTilde(raw)
      if (!path.isAbsolute(expanded)) {
        return { status: 'error', message: 'Path must be absolute (start with / or ~)' }
      }
      try {
        const info = await stat(expanded)
        if (!info.isDirectory()) {
          return { status: 'error', message: 'Path is not a directory' }
        }
        process.chdir(expanded)
        return { status: 'opened', workspace: checkWorkspace(process.cwd(), homedir()) }
      } catch (err) {
        const code = err instanceof Error && 'code' in err ? (err as NodeJS.ErrnoException).code : ''
        if (code === 'ENOENT') return { status: 'error', message: 'Directory does not exist' }
        return { status: 'error', message: err instanceof Error ? err.message : String(err) }
      }
    },

    async saveTopology(topology: string): Promise<TopologyExportOutcome> {
      const status = checkWorkspace(process.cwd(), homedir())
      if (!status.valid) return { status: 'invalidWorkspace', reason: status.reason }

      const target = topologyPathFor(status.name)
      try {
        await writeFile(target, topology, 'utf8')
        return { status: 'saved', topologyPath: target, name: status.name }
      } catch (err) {
        return { status: 'error', message: err instanceof Error ? err.message : String(err) }
      }
    },

    async loadTopology(): Promise<TopologyLoadOutcome> {
      const status = checkWorkspace(process.cwd(), homedir())
      if (!status.valid) return { status: 'notFound' }

      const target = topologyPathFor(status.name)
      try {
        const topology = await tryRead(target)
        if (topology === null) return { status: 'notFound' }
        return { status: 'loaded', topology, topologyPath: target }
      } catch (err) {
        return { status: 'error', message: err instanceof Error ? err.message : String(err) }
      }
    }
  }
}

export { createFsWorkspaceStore }
