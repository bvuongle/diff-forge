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

  const brightNodeIds = useMemo(() => {
    if (selectedNodeIds.size > 0) {
      const related = new Set<string>(selectedNodeIds)
      for (const nodeId of selectedNodeIds) {
        for (const e of graph.edges) {
          if (e.sourceNodeId === nodeId) related.add(e.targetNodeId)
          if (e.targetNodeId === nodeId) related.add(e.sourceNodeId)
        }
      }
      return related
    }
    if (selectedEdgeId) {
      const edge = graph.edges.find((e) => e.id === selectedEdgeId)
      if (!edge) return null
      return new Set([edge.sourceNodeId, edge.targetNodeId])
    }
    return null
  }, [selectedNodeIds, selectedEdgeId, graph.edges])

  const brightEdgeIds = useMemo(() => {
    if (selectedNodeIds.size > 0) return selectedEdgeIds
    if (selectedEdgeId) return new Set([selectedEdgeId])
    return null
  }, [selectedNodeIds, selectedEdgeId, selectedEdgeIds])

  return { selectedEdgeIds, brightNodeIds, brightEdgeIds }
}
