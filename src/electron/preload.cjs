'use strict'

const { contextBridge, ipcRenderer } = require('electron')

const electronAPI = {
  workspace: {
    status: () => ipcRenderer.invoke('workspace:status'),
    openAtPath: (payload) => ipcRenderer.invoke('workspace:openAtPath', payload)
  },
  dialog: {
    openWorkspace: () => ipcRenderer.invoke('dialog:openWorkspace')
  },
  topology: {
    export: (payload) => ipcRenderer.invoke('topology:export', payload),
    load: () => ipcRenderer.invoke('topology:load')
  },
  catalog: {
    load: () => ipcRenderer.invoke('catalog:load')
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
