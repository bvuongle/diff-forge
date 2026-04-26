import { useCallback, useRef } from 'react'

import { type Connection } from '@xyflow/react'

import { validateEdge } from '@core/graph/GraphOperations'
import type { Graph } from '@core/graph/GraphTypes'
import { useGraphStore } from '@state/graphStore'
import { OUT_HANDLE_ID } from '@canvas/canvasConstants'
import { type CanvasEdge as CanvasEdgeType } from '@canvas/canvasTypes'

function resolveSourceSlot(
  graph: Graph,
  sourceHandle: string,
  sourceId: string,
  targetId: string,
  targetSlot: string
): string {
  if (sourceHandle !== OUT_HANDLE_ID) return sourceHandle
  const srcNode = graph.nodes.find((n) => n.id === sourceId)
  const tgtNode = graph.nodes.find((n) => n.id === targetId)
  const tgtSlotObj = tgtNode?.slots.find((s) => s.name === targetSlot && s.direction === 'in')
  const matchingOut = srcNode?.slots.find((s) => s.direction === 'out' && s.interface === tgtSlotObj?.interface)
  return matchingOut?.name ?? sourceHandle
}

function buildEdgeId(source: string, sourceSlot: string, target: string, targetSlot: string): string {
  return `${source}:${sourceSlot}->${target}:${targetSlot}`
}

export function useCanvasConnection() {
  const graph = useGraphStore((s) => s.graph)
  const addEdge = useGraphStore((s) => s.addEdge)
  const removeEdge = useGraphStore((s) => s.removeEdge)

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) return

      const targetSlot = connection.targetHandle
      const sourceSlot = resolveSourceSlot(
        graph,
        connection.sourceHandle,
        connection.source,
        connection.target,
        targetSlot
      )

      const validation = validateEdge(graph, connection.source, sourceSlot, connection.target, targetSlot)
      if (!validation.valid) return

      addEdge({
        id: buildEdgeId(connection.source, sourceSlot, connection.target, targetSlot),
        sourceNodeId: connection.source,
        sourceSlot,
        targetNodeId: connection.target,
        targetSlot
      })
    },
    [graph, addEdge]
  )

  const isValidConnection = useCallback(
    (connection: Connection | CanvasEdgeType) => {
      const src = connection.source
      const tgt = connection.target
      if (!src || !tgt) return false
      if (src === tgt) return false

      const sourceHandle = ('sourceHandle' in connection ? connection.sourceHandle : '') ?? ''
      const targetSlot = ('targetHandle' in connection ? connection.targetHandle : '') ?? ''

      if (sourceHandle === OUT_HANDLE_ID) {
        const srcNode = graph.nodes.find((n) => n.id === src)
        const tgtNode = graph.nodes.find((n) => n.id === tgt)
        const tgtSlotObj = tgtNode?.slots.find((s) => s.name === targetSlot && s.direction === 'in')
        return srcNode?.slots.some((s) => s.direction === 'out' && s.interface === tgtSlotObj?.interface) ?? false
      }

      return validateEdge(graph, src, sourceHandle, tgt, targetSlot).valid
    },
    [graph]
  )

  const edgeReconnectSuccessful = useRef(true)

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false
  }, [])

  const onReconnect = useCallback(
    (oldEdge: CanvasEdgeType, newConnection: Connection) => {
      edgeReconnectSuccessful.current = true
      if (!newConnection.source || !newConnection.target || !newConnection.sourceHandle || !newConnection.targetHandle)
        return

      const targetSlot = newConnection.targetHandle
      const sourceSlot = resolveSourceSlot(
        graph,
        newConnection.sourceHandle,
        newConnection.source,
        newConnection.target,
        targetSlot
      )

      const validation = validateEdge(graph, newConnection.source, sourceSlot, newConnection.target, targetSlot)
      if (!validation.valid) return

      removeEdge(oldEdge.id)
      addEdge({
        id: buildEdgeId(newConnection.source, sourceSlot, newConnection.target, targetSlot),
        sourceNodeId: newConnection.source,
        sourceSlot,
        targetNodeId: newConnection.target,
        targetSlot
      })
    },
    [graph, addEdge, removeEdge]
  )

  const onReconnectEnd = useCallback(
    (_event: MouseEvent | TouchEvent, edge: CanvasEdgeType) => {
      if (!edgeReconnectSuccessful.current) {
        removeEdge(edge.id)
      }
      edgeReconnectSuccessful.current = true
    },
    [removeEdge]
  )

  return { onConnect, isValidConnection, onReconnectStart, onReconnect, onReconnectEnd }
}
