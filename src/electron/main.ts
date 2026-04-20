import { readFile, stat, writeFile } from 'fs/promises'
import { homedir } from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

import { app, BrowserWindow, dialog, ipcMain } from 'electron'

import { checkWorkspace } from '../domain/workspace/workspaceContext'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

let mainWindow: BrowserWindow | null = null

type ProjectPaths = { topologyPath: string; projectName: string }

function projectPaths(projectName: string): ProjectPaths {
  const cwd = process.cwd()
  return {
    projectName,
    topologyPath: path.join(cwd, `${projectName}.forge.json`)
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

ipcMain.handle('workspace:status', async () => {
  return checkWorkspace(process.cwd(), homedir())
})

ipcMain.handle('dialog:openWorkspace', async () => {
  if (!mainWindow) {
    return { status: 'error', message: 'Window not ready' }
  }
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select workspace folder'
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { status: 'canceled' }
    }
    const picked = result.filePaths[0]
    process.chdir(picked)
    return { status: 'opened', workspace: checkWorkspace(process.cwd(), homedir()) }
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
})

function expandTilde(target: string): string {
  if (target === '~') return homedir()
  if (target.startsWith('~/')) return path.join(homedir(), target.slice(2))
  return target
}

ipcMain.handle('workspace:openAtPath', async (_event, payload: { path: string }) => {
  const raw = payload?.path?.trim()
  if (!raw) return { status: 'error', message: 'Path is empty' }
  const target = expandTilde(raw)
  if (!path.isAbsolute(target)) {
    return { status: 'error', message: 'Path must be absolute (start with / or ~)' }
  }
  try {
    const info = await stat(target)
    if (!info.isDirectory()) {
      return { status: 'error', message: 'Path is not a directory' }
    }
    process.chdir(target)
    return { status: 'opened', workspace: checkWorkspace(process.cwd(), homedir()) }
  } catch (err) {
    const code = err instanceof Error && 'code' in err ? (err as NodeJS.ErrnoException).code : ''
    if (code === 'ENOENT') return { status: 'error', message: 'Directory does not exist' }
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
})

ipcMain.handle('project:export', async (_event, payload: { topology: string }) => {
  const status = checkWorkspace(process.cwd(), homedir())
  if (!status.valid) return { status: 'invalidWorkspace', reason: status.reason }

  const paths = projectPaths(status.projectName)
  try {
    await writeFile(paths.topologyPath, payload.topology, 'utf8')
    return {
      status: 'saved',
      topologyPath: paths.topologyPath,
      projectName: paths.projectName
    }
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
})

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

ipcMain.handle('project:load', async () => {
  const status = checkWorkspace(process.cwd(), homedir())
  if (!status.valid) return { status: 'notFound' }

  const paths = projectPaths(status.projectName)
  try {
    const topology = await tryRead(paths.topologyPath)
    if (topology === null) return { status: 'notFound' }
    return {
      status: 'loaded',
      topology,
      topologyPath: paths.topologyPath
    }
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
})

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
