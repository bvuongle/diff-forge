import { graphToTopology } from '@core/topology/graphToTopology'
import { reasonMessage } from '@core/workspace/workspaceContext'
import { useGraphStore } from '@state/graphStore'
import { notify } from '@state/notificationsStore'
import { useUIStore } from '@state/uiStore'
import { useWorkspaceStore } from '@state/workspaceStore'
import { ipcWorkspaceStore } from '@adapters/IpcWorkspaceStore'

async function exportTopology(): Promise<void> {
  const workspace = useWorkspaceStore.getState().status
  if (!workspace?.valid) {
    notify.error('Open a workspace before exporting.')
    return
  }
  const graph = useGraphStore.getState().graph
  const topology = JSON.stringify(graphToTopology(graph), null, 2)
  const outcome = await ipcWorkspaceStore.saveTopology(topology)
  if (outcome.status === 'saved') {
    notify.success(`Wrote ${outcome.topologyPath.split('/').pop() ?? outcome.topologyPath}`)
    useGraphStore.getState().markClean()
  } else if (outcome.status === 'invalidWorkspace') {
    notify.error(`Export blocked: ${reasonMessage(outcome.reason)}`)
  } else {
    notify.error(`Export failed: ${outcome.message}`)
  }
}

async function performWorkspaceSwitch(): Promise<void> {
  const result = await ipcWorkspaceStore.openPicker()
  if (result.status === 'opened') {
    useWorkspaceStore.getState().setStatus(result.workspace)
  } else if (result.status === 'error') {
    notify.error(`Workspace switch failed: ${result.message}`)
  }
}

function requestWorkspaceSwitch(): void {
  if (useGraphStore.getState().dirty) {
    useUIStore.getState().setSwitchConfirmOpen(true)
  } else {
    performWorkspaceSwitch()
  }
}

export { exportTopology, performWorkspaceSwitch, requestWorkspaceSwitch }
