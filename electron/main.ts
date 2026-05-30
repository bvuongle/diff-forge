import path from 'path'
import { fileURLToPath } from 'url'

import { app, BrowserWindow, dialog, ipcMain } from 'electron'

import { createArtifactoryCatalogSource } from '@adapters/ArtifactoryCatalogSource'
import { createFsCatalogCache } from '@adapters/FsCatalogCache'
import { createFsWorkspaceStore } from '@adapters/FsWorkspaceStore'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: !process.env.HEADLESS,
    paintWhenInitiallyHidden: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false
    }
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl)
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
  const workspaceStore = createFsWorkspaceStore({
    selectDirectory: async () => {
      if (!mainWindow) return null
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select workspace folder'
      })
      if (result.canceled || result.filePaths.length === 0) return null
      return result.filePaths[0]
    }
  })

  ipcMain.handle('workspace:status', () => workspaceStore.getStatus())
  ipcMain.handle('dialog:openWorkspace', () => workspaceStore.openWorkspaceSelector())
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
