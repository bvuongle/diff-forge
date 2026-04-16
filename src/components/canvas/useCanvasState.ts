import { useEffect, useState } from 'react'

import { useGraphStore } from '@state/graphStore'

import { toCanvasEdges, toCanvasNodes, type CanvasEdge, type CanvasNode } from './canvasTypes'

function useCanvasState() {
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>(() =>
    toCanvasNodes(useGraphStore.getState().graph.nodes)
  )
  const [canvasEdges, setCanvasEdges] = useState<CanvasEdge[]>(() =>
    toCanvasEdges(useGraphStore.getState().graph.edges)
  )

  useEffect(() => {
    const unsubNodes = useGraphStore.subscribe(
      (s) => s.graph.nodes,
      (nodes) => setCanvasNodes(toCanvasNodes(nodes))
    )
    const unsubEdges = useGraphStore.subscribe(
      (s) => s.graph.edges,
      (edges) => setCanvasEdges(toCanvasEdges(edges))
    )
    return () => {
      unsubNodes()
      unsubEdges()
    }
  }, [])

  return { canvasNodes, setCanvasNodes, canvasEdges, setCanvasEdges }
}

export { useCanvasState }
