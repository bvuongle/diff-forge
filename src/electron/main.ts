import path from 'path'
import { fileURLToPath } from 'url'
import { app, BrowserWindow, ipcMain } from 'electron'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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

// TODO: implement actual catalog loading via Electron IPC
ipcMain.handle('catalog:load', async () => {
  return { schema: 'diff.catalog.v0', components: [] }
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
