import { useMemo } from 'react'

import { Graph } from '@domain/graph/GraphTypes'

export function useCanvasSelection(graph: Graph, selectedNodeIds: Set<string>, selectedEdgeId: string | null) {
  const selectedEdgeIds = useMemo(() => {
    const ids = new Set<string>()
    if (selectedEdgeId) ids.add(selectedEdgeId)
    for (const nodeId of selectedNodeIds) {
      for (const e of graph.edges) {
        if (e.sourceNodeId === nodeId || e.targetNodeId === nodeId) ids.add(e.id)
      }
    }
    return ids
  }, [selectedNodeIds, selectedEdgeId, graph.edges])

  const edgeDimNodeIds = useMemo(() => {
    if (!selectedEdgeId) return null
    const edge = graph.edges.find((e) => e.id === selectedEdgeId)
    if (!edge) return null
    const related = new Set<string>()
    related.add(edge.sourceNodeId)
    related.add(edge.targetNodeId)
    return related
  }, [selectedEdgeId, graph.edges])

  const edgeDimEdgeIds = useMemo(() => {
    if (!selectedEdgeId) return null
    const related = new Set<string>()
    related.add(selectedEdgeId)
    return related
  }, [selectedEdgeId])

  return { selectedEdgeIds, edgeDimNodeIds, edgeDimEdgeIds }
}
