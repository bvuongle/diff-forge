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
  project: {
    export: (payload) => ipcRenderer.invoke('project:export', payload),
    load: () => ipcRenderer.invoke('project:load')
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
