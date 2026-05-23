import { computeInvalidNodeIds } from '@core/graph/graphValidation'
import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'

const VALIDATION_DEBOUNCE_MS = 150

function pruneSet(set: Set<string>, validIds: Set<string>): Set<string> | null {
  if (set.size === 0) return null
  let changed = false
  const next = new Set<string>()
  for (const id of set) {
    if (validIds.has(id)) next.add(id)
    else changed = true
  }
  return changed ? next : null
}

function setupStateSubscriptions(): () => void {
  let validationTimer: ReturnType<typeof setTimeout> | null = null

  const unsubGraph = useGraphStore.subscribe(
    (s) => s.graph,
    (graph) => {
      const nodeIds = new Set(graph.nodes.map((n) => n.id))
      const edgeIds = new Set(graph.edges.map((e) => e.id))

      const graphState = useGraphStore.getState()
      const nextSelectedNodes = pruneSet(graphState.selectedNodeIds, nodeIds)
      const nextSelectedEdges = pruneSet(graphState.selectedEdgeIds, edgeIds)
      if (nextSelectedNodes || nextSelectedEdges) {
        useGraphStore.setState({
          ...(nextSelectedNodes && { selectedNodeIds: nextSelectedNodes }),
          ...(nextSelectedEdges && { selectedEdgeIds: nextSelectedEdges })
        })
      }

      const uiState = useUIStore.getState()
      const nextExpanded = pruneSet(uiState.expandedNodeIds, nodeIds)
      if (nextExpanded) {
        useUIStore.setState({ expandedNodeIds: nextExpanded })
      }

      if (graphState.flaggedNodeIds.size === 0) return
      if (validationTimer) clearTimeout(validationTimer)
      validationTimer = setTimeout(() => {
        validationTimer = null
        const flagged = useGraphStore.getState().flaggedNodeIds
        if (flagged.size === 0) return
        const stillInvalid = computeInvalidNodeIds(useGraphStore.getState().graph)
        const next = new Set<string>()
        for (const id of flagged) if (stillInvalid.has(id)) next.add(id)
        if (next.size !== flagged.size) {
          useGraphStore.getState().setFlaggedNodeIds(next)
        }
      }, VALIDATION_DEBOUNCE_MS)
    }
  )

  return () => {
    if (validationTimer) clearTimeout(validationTimer)
    unsubGraph()
  }
}

export { setupStateSubscriptions, VALIDATION_DEBOUNCE_MS }
