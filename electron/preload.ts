import { contextBridge, ipcRenderer } from 'electron'

type ElectronAPI = {
  catalog: {
    load: () => Promise<unknown>
  }
}

const electronAPI: ElectronAPI = {
  catalog: {
    load: () => ipcRenderer.invoke('catalog:load')
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
