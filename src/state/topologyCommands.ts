import { validateNodeConfigs } from '@core/catalog/configValidation'
import { computeInvalidNodeIds, GraphValidationResult, validateGraph } from '@core/graph/graphValidation'
import { graphToTopology } from '@core/topology/graphToTopology'
import { reasonMessage } from '@core/workspace/workspaceContext'
import { useCatalogStore } from '@state/catalogStore'
import { useGraphStore } from '@state/graphStore'
import { notify } from '@state/notificationsStore'
import { useUIStore } from '@state/uiStore'
import { useWorkspaceStore } from '@state/workspaceStore'
import { ipcWorkspaceStore } from '@adapters/IpcWorkspaceStore'

function describeExportBlock(v: GraphValidationResult, hasConfigError: boolean): { title: string; items: string[] } {
  const items: string[] = []
  for (const cycle of v.cycles) {
    items.push(`Cycle: ${cycle.join(' -> ')}`)
  }
  for (const u of v.unfilled) {
    items.push(`Missing input: ${u.instanceId}.${u.slotName}`)
  }
  if (v.invalidEdges.length > 0) {
    items.push(`${v.invalidEdges.length} invalid edge(s)`)
  }
  if (hasConfigError) {
    items.push('One or more config fields are invalid')
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
  const catalog = useCatalogStore.getState().catalog?.components ?? []
  const validation = validateGraph(graph)
  const configErrors = validateNodeConfigs(graph, catalog)
  if (!validation.valid || configErrors.length > 0) {
    const flagged = computeInvalidNodeIds(graph, validation)
    for (const e of configErrors) flagged.add(e.nodeId)
    useGraphStore.getState().setFlaggedNodeIds(flagged)
    notify.error(describeExportBlock(validation, configErrors.length > 0))
    return
  }
  const topology = JSON.stringify(graphToTopology(graph), null, 2)
  const result = await ipcWorkspaceStore.saveTopology(topology)
  if (result.status === 'saved') {
    notify.success(`Wrote ${result.topologyPath.split('/').pop() ?? result.topologyPath}`)
    useGraphStore.getState().markClean()
    useGraphStore.getState().setFlaggedNodeIds(new Set())
  } else if (result.status === 'invalidWorkspace') {
    notify.error(`Export blocked: ${reasonMessage(result.reason)}`)
  } else {
    notify.error(`Export failed: ${result.message}`)
  }
}

async function performWorkspaceSwitch(): Promise<void> {
  const result = await ipcWorkspaceStore.openWorkspaceSelector()
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
