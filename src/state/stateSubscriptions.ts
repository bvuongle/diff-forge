import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'

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
  return useGraphStore.subscribe(
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
    }
  )
}

export { setupStateSubscriptions }
