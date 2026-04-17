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
            const next = toCanvasNodes(graph.nodes).map((newNode) => {
              const existing = nds.find((n) => n.id === newNode.id)
              if (existing) {
                return { ...newNode, selected: selected.has(newNode.id) }
              }
              return newNode
            })
            return next
          })
          lastGraphNodes.current = graph.nodes
        }
        if (graph.edges !== lastGraphEdges.current) {
          const selected = useGraphStore.getState().selectedEdgeIds
          setCanvasEdges((eds) => {
            const next = toCanvasEdges(graph.edges).map((newEdge) => {
              const existing = eds.find((e) => e.id === newEdge.id)
              if (existing) {
                return { ...newEdge, selected: selected.has(newEdge.id) }
              }
              return newEdge
            })
            return next
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

  return { canvasNodes, setCanvasNodes, onNodesChange, canvasEdges, setCanvasEdges, onEdgesChange }
}

export { useCanvasState }
