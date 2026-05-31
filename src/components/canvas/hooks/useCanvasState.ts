import { useEffect, useRef } from 'react'

import { useEdgesState, useNodesState } from '@xyflow/react'

import { useGraphStore } from '@state/graphStore'
import { toCanvasEdges, toCanvasNodes, type CanvasEdge, type CanvasNode } from '@canvas/canvasTypes'

function useCanvasState() {
  const [canvasNodes, setCanvasNodes, onNodesChange] = useNodesState<CanvasNode>([])
  const [canvasEdges, setCanvasEdges, onEdgesChange] = useEdgesState<CanvasEdge>([])

  const lastGraphNodes = useRef(useGraphStore.getState().graph.nodes)
  const lastGraphEdges = useRef(useGraphStore.getState().graph.edges)

  useEffect(() => {
    const unsub = useGraphStore.subscribe(
      (s) => s.graph,
      (graph) => {
        if (graph.nodes !== lastGraphNodes.current) {
          const selected = useGraphStore.getState().selectedNodeIds
          setCanvasNodes((nds) => {
            const ids = new Set(nds.map((n) => n.id))
            return toCanvasNodes(graph.nodes).map((newNode) =>
              ids.has(newNode.id) ? { ...newNode, selected: selected.has(newNode.id) } : newNode
            )
          })
          lastGraphNodes.current = graph.nodes
        }
        if (graph.edges !== lastGraphEdges.current) {
          const selected = useGraphStore.getState().selectedEdgeIds
          setCanvasEdges((eds) => {
            const ids = new Set(eds.map((e) => e.id))
            return toCanvasEdges(graph.edges).map((newEdge) =>
              ids.has(newEdge.id) ? { ...newEdge, selected: selected.has(newEdge.id) } : newEdge
            )
          })
          lastGraphEdges.current = graph.edges
        }
      }
    )

    const state = useGraphStore.getState()
    setCanvasNodes(toCanvasNodes(state.graph.nodes).map((n) => ({ ...n, selected: state.selectedNodeIds.has(n.id) })))
    setCanvasEdges(toCanvasEdges(state.graph.edges).map((e) => ({ ...e, selected: state.selectedEdgeIds.has(e.id) })))

    return unsub
  }, [setCanvasNodes, setCanvasEdges])

  return { canvasNodes, onNodesChange, canvasEdges, onEdgesChange }
}

export { useCanvasState }
