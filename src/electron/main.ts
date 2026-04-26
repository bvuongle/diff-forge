import path from 'path'
import { fileURLToPath } from 'url'

import { app, BrowserWindow, ipcMain } from 'electron'

import { createArtifactoryCatalogSource } from '../adapters/ArtifactoryCatalogSource'
import { createFsCatalogCache } from '../adapters/FsCatalogCache'
import { createFsWorkspaceStore } from '../adapters/FsWorkspaceStore'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

let mainWindow: BrowserWindow | null = null

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

app.on('ready', () => {
  const cache = createFsCatalogCache({ baseDir: app.getPath('userData') })
  const catalogSource = createArtifactoryCatalogSource({ env: process.env, fetch, cache })
  const workspaceStore = createFsWorkspaceStore({ getMainWindow: () => mainWindow })

  ipcMain.handle('workspace:status', () => workspaceStore.getStatus())
  ipcMain.handle('dialog:openWorkspace', () => workspaceStore.openPicker())
  ipcMain.handle('workspace:openAtPath', (_e, payload: { path: string }) =>
    workspaceStore.openAtPath(payload?.path ?? '')
  )
  ipcMain.handle('topology:export', (_e, payload: { topology: string }) =>
    workspaceStore.saveTopology(payload.topology)
  )
  ipcMain.handle('topology:load', () => workspaceStore.loadTopology())
  ipcMain.handle('catalog:load', () => catalogSource.loadCatalog())

  createWindow()
})

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
