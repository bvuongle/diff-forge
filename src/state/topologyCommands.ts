import { computeInvalidNodeIds, GraphValidationOutcome, validateGraph } from '@core/graph/graphValidation'
import { graphToTopology } from '@core/topology/graphToTopology'
import { reasonMessage } from '@core/workspace/workspaceContext'
import { useGraphStore } from '@state/graphStore'
import { notify } from '@state/notificationsStore'
import { useUIStore } from '@state/uiStore'
import { useWorkspaceStore } from '@state/workspaceStore'
import { ipcWorkspaceStore } from '@adapters/IpcWorkspaceStore'

function describeValidation(v: GraphValidationOutcome): { title: string; items: string[] } {
  const items: string[] = []
  for (const cycle of v.cycles) {
    items.push(`Cycle: ${cycle.join(' → ')}`)
  }
  for (const u of v.unfilled) {
    items.push(`Missing input: ${u.instanceId}.${u.slotName}`)
  }
  if (v.invalidEdges.length > 0) {
    items.push(`${v.invalidEdges.length} invalid edge(s)`)
  }
  return { title: 'Cannot export', items }
}

async function exportTopology(): Promise<void> {
  const workspace = useWorkspaceStore.getState().status
  if (!workspace?.valid) {
    notify.error('Open a workspace before exporting.')
    return
  }
  const graph = useGraphStore.getState().graph
  const validation = validateGraph(graph)
  if (!validation.valid) {
    useGraphStore.getState().setFlaggedNodeIds(computeInvalidNodeIds(graph))
    notify.error(describeValidation(validation))
    return
  }
  const topology = JSON.stringify(graphToTopology(graph), null, 2)
  const outcome = await ipcWorkspaceStore.saveTopology(topology)
  if (outcome.status === 'saved') {
    notify.success(`Wrote ${outcome.topologyPath.split('/').pop() ?? outcome.topologyPath}`)
    useGraphStore.getState().markClean()
    useGraphStore.getState().setFlaggedNodeIds(new Set())
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
