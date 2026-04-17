import { useCallback } from 'react'

import { Box, Typography } from '@mui/material'
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  type EdgeChange,
  type NodeChange,
  type OnSelectionChangeFunc
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'

import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'

import { CanvasToolkit } from './CanvasToolkit'
import { type CanvasEdge as CanvasEdgeType, type CanvasNode } from './canvasTypes'
import { CanvasEdge } from './edges/CanvasEdge'
import { useCanvasConnection } from './hooks/useCanvasConnection'
import { useCanvasHotkeys } from './hooks/useCanvasHotkeys'
import { useCanvasState } from './hooks/useCanvasState'
import { useCatalogDrop } from './hooks/useCatalogDrop'
import { CanvasNode as CanvasNodeComponent } from './nodes/CanvasNode'

const nodeTypes = { component: CanvasNodeComponent }
const edgeTypes = { component: CanvasEdge }

function CanvasPanelInner() {
  const graph = useGraphStore((s) => s.graph)
  const removeNode = useGraphStore((s) => s.removeNode)
  const removeEdge = useGraphStore((s) => s.removeEdge)
  const moveNode = useGraphStore((s) => s.moveNode)
  const selectNode = useGraphStore((s) => s.selectNode)
  const selectEdge = useGraphStore((s) => s.selectEdge)
  const selectElements = useGraphStore((s) => s.selectElements)
  const clearSelection = useGraphStore((s) => s.clearSelection)
  const canvasMode = useUIStore((s) => s.canvasMode)
  const snapToGrid = useUIStore((s) => s.snapToGrid)

  const {
    canvasNodes,
    onNodesChange: onFlowNodesChange,
    canvasEdges,
    onEdgesChange: onFlowEdgesChange
  } = useCanvasState()

  const { onConnect, isValidConnection, onReconnectStart, onReconnect, onReconnectEnd } = useCanvasConnection()
  const { onDragOver, onDrop } = useCatalogDrop()
  useCanvasHotkeys()

  const onNodesChange = useCallback(
    (changes: NodeChange<CanvasNode>[]) => {
      onFlowNodesChange(changes)
      for (const change of changes) {
        if (change.type === 'remove') {
          removeNode(change.id)
        }
      }
    },
    [onFlowNodesChange, removeNode]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange<CanvasEdgeType>[]) => {
      onFlowEdgesChange(changes)
      for (const change of changes) {
        if (change.type === 'remove') {
          removeEdge(change.id)
        }
      }
    },
    [onFlowEdgesChange, removeEdge]
  )

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent | React.TouchEvent, _node: CanvasNode, nodes: CanvasNode[]) => {
      for (const n of nodes) {
        moveNode(n.id, n.position)
      }
    },
    [moveNode]
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: CanvasNode) => {
      selectNode(node.id)
    },
    [selectNode]
  )

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: CanvasEdgeType) => {
      selectEdge(edge.id)
    },
    [selectEdge]
  )

  const onPaneClick = useCallback(() => clearSelection(), [clearSelection])

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes, edges }) => {
      const newNodeIds = nodes.map((n) => n.id)
      const newEdgeIds = edges.map((e) => e.id)

      const current = useGraphStore.getState()
      const nodesMatch =
        newNodeIds.length === current.selectedNodeIds.size && newNodeIds.every((id) => current.selectedNodeIds.has(id))
      const edgesMatch =
        newEdgeIds.length === current.selectedEdgeIds.size && newEdgeIds.every((id) => current.selectedEdgeIds.has(id))

      if (!nodesMatch || !edgesMatch) {
        selectElements(newNodeIds, newEdgeIds)
      }
    },
    [selectElements]
  )

  const isPanMode = canvasMode === 'pan'

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }} onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={canvasNodes}
        edges={canvasEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        edgesReconnectable={true}
        onReconnectStart={onReconnectStart}
        onReconnect={onReconnect}
        onReconnectEnd={onReconnectEnd}
        connectionRadius={40}
        panOnDrag={isPanMode ? true : [1, 2]}
        selectionOnDrag={!isPanMode}
        selectionMode={SelectionMode.Partial}
        panOnScroll={false}
        zoomOnScroll
        minZoom={0.1}
        maxZoom={3}
        snapToGrid={snapToGrid}
        selectNodesOnDrag={false}
        connectionLineStyle={{ stroke: 'var(--edge-default)', strokeWidth: 2, strokeDasharray: '6,4' }}
        defaultEdgeOptions={{ type: 'component' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} size={3} color="var(--grid-color)" />
        <CanvasToolkit />
        <MiniMap position="top-right" pannable zoomable />
      </ReactFlow>

      {graph.nodes.length === 0 && (
        <Box
          position="absolute"
          sx={{ inset: 0, pointerEvents: 'none' }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box textAlign="center">
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Canvas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Drag components from the catalog to place nodes.
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  )
}

function CanvasPanel() {
  return (
    <ReactFlowProvider>
      <CanvasPanelInner />
    </ReactFlowProvider>
  )
}

export { CanvasPanel }
