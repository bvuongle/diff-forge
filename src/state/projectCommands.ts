import { reasonMessage } from '@domain/workspace/workspaceContext'
import { useGraphStore } from '@state/graphStore'
import { notify } from '@state/notificationsStore'
import { useUIStore } from '@state/uiStore'
import { useWorkspaceStore } from '@state/workspaceStore'
import { saveProjectViaElectron } from '@adapters/electronProjectBridge'
import { openWorkspacePicker } from '@adapters/electronWorkspace'
import { createJsonProjectExporter } from '@adapters/JsonProjectExporter'

function basename(p: string): string {
  return p.split('/').pop() ?? p
}

const exporter = createJsonProjectExporter({ saveProject: saveProjectViaElectron })

async function exportTopology(): Promise<void> {
  const workspace = useWorkspaceStore.getState().status
  if (!workspace?.valid) {
    notify.error('Open a workspace before exporting.')
    return
  }
  const graph = useGraphStore.getState().graph
  const outcome = await exporter.export(graph)
  if (outcome.status === 'saved') {
    notify.success(`Wrote ${basename(outcome.topologyPath)}`)
    useGraphStore.getState().markClean()
  } else if (outcome.status === 'invalidWorkspace') {
    notify.error(`Export blocked: ${reasonMessage(outcome.reason)}`)
  } else {
    notify.error(`Export failed: ${outcome.message}`)
  }
}

async function performWorkspaceSwitch(): Promise<void> {
  const result = await openWorkspacePicker()
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
