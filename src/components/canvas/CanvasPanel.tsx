import { useCallback, useEffect, useRef } from 'react'

import { Box, Typography } from '@mui/material'
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  reconnectEdge,
  SelectionMode,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnNodeDrag,
  type OnSelectionChangeFunc
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'

import { CatalogComponentZ } from '@domain/catalog/CatalogSchema'
import { validateEdge } from '@domain/graph/GraphOperations'
import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'

import {
  CONNECTION_RADIUS,
  MINIMAP_HEIGHT,
  MINIMAP_WIDTH,
  NODE_DROP_OFFSET_Y,
  NODE_WIDTH_COMPACT,
  OUT_HANDLE_ID,
  SNAP_GRID_SIZE
} from './canvasConstants'
import { CanvasToolkit } from './CanvasToolkit'
import { type CanvasEdge as CanvasEdgeType, type CanvasNode } from './canvasTypes'
import { CanvasEdge } from './edges/CanvasEdge'
import { CanvasNode as CanvasNodeComponent } from './nodes/CanvasNode'
import { createNodeFromCatalog } from './nodes/createNodeFromCatalog'
import { useCanvasState } from './useCanvasState'

const nodeTypes = { component: CanvasNodeComponent }
const edgeTypes = { component: CanvasEdge }
const SNAP_GRID: [number, number] = [SNAP_GRID_SIZE, SNAP_GRID_SIZE]

function CanvasPanelInner() {
  const { screenToFlowPosition } = useReactFlow()
  const graph = useGraphStore((s) => s.graph)
  const addNode = useGraphStore((s) => s.addNode)
  const addEdge = useGraphStore((s) => s.addEdge)
  const moveNode = useGraphStore((s) => s.moveNode)
  const selectNode = useGraphStore((s) => s.selectNode)
  const selectNodes = useGraphStore((s) => s.selectNodes)
  const selectEdge = useGraphStore((s) => s.selectEdge)
  const selectElements = useGraphStore((s) => s.selectElements)
  const clearSelection = useGraphStore((s) => s.clearSelection)
  const removeSelectedNodes = useGraphStore((s) => s.removeSelectedNodes)
  const removeEdge = useGraphStore((s) => s.removeEdge)
  const canvasMode = useUIStore((s) => s.canvasMode)
  const setCanvasMode = useUIStore((s) => s.setCanvasMode)
  const snapToGrid = useUIStore((s) => s.snapToGrid)

  const { canvasNodes, setCanvasNodes, canvasEdges, setCanvasEdges } = useCanvasState()

  const onNodesChange = useCallback(
    (changes: NodeChange<CanvasNode>[]) => {
      setCanvasNodes((nds) => applyNodeChanges(changes, nds))
    },
    [setCanvasNodes]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange<CanvasEdgeType>[]) => {
      setCanvasEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [setCanvasEdges]
  )

  const onNodeDragStop: OnNodeDrag<CanvasNode> = useCallback(
    (_event, _node, nodes) => {
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
    ({ nodes }) => {
      if (nodes.length > 0) {
        const nodeIds = new Set(nodes.map((n) => n.id))
        const graphEdges = useGraphStore.getState().graph.edges
        const edgeIds = graphEdges
          .filter((e) => nodeIds.has(e.sourceNodeId) && nodeIds.has(e.targetNodeId))
          .map((e) => e.id)
        selectElements([...nodeIds], edgeIds)
      }
    },
    [selectElements]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) return

      let sourceSlot = connection.sourceHandle
      const targetSlot = connection.targetHandle

      if (sourceSlot === OUT_HANDLE_ID) {
        const srcNode = graph.nodes.find((n) => n.id === connection.source)
        const tgtNode = graph.nodes.find((n) => n.id === connection.target)
        const tgtSlotObj = tgtNode?.slots.find((s) => s.name === targetSlot && s.direction === 'in')
        const matchingOut = srcNode?.slots.find((s) => s.direction === 'out' && s.interface === tgtSlotObj?.interface)
        if (matchingOut) sourceSlot = matchingOut.name
      }

      const validation = validateEdge(graph, connection.source, sourceSlot, connection.target, targetSlot)
      if (!validation.valid) return

      addEdge({
        id: `${connection.source}:${sourceSlot}->${connection.target}:${targetSlot}`,
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

      const sourceSlot = ('sourceHandle' in connection ? connection.sourceHandle : '') ?? ''
      const targetSlot = ('targetHandle' in connection ? connection.targetHandle : '') ?? ''

      if (sourceSlot === OUT_HANDLE_ID) {
        const srcNode = graph.nodes.find((n) => n.id === src)
        const tgtNode = graph.nodes.find((n) => n.id === tgt)
        const tgtSlotObj = tgtNode?.slots.find((s) => s.name === targetSlot && s.direction === 'in')
        return srcNode?.slots.some((s) => s.direction === 'out' && s.interface === tgtSlotObj?.interface) ?? false
      }

      return validateEdge(graph, src, sourceSlot, tgt, targetSlot).valid
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
      setCanvasEdges((eds) => reconnectEdge(oldEdge, newConnection, eds))
    },
    [setCanvasEdges]
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

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-diff-component')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData('application/x-diff-component')
      if (!raw) return
      const parsed = CatalogComponentZ.safeParse(JSON.parse(raw))
      if (!parsed.success) return
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      position.x -= NODE_WIDTH_COMPACT / 2
      position.y -= NODE_DROP_OFFSET_Y
      const node = createNodeFromCatalog(parsed.data, position, graph.nodes)
      addNode(node)
      selectNode(node.id)
    },
    [screenToFlowPosition, graph.nodes, addNode, selectNode]
  )

  useEffect(() => {
    let previousMode: 'select' | 'pan' | null = null

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useGraphStore.getState()
        if (state.selectedNodeIds.size > 0) removeSelectedNodes()
        else if (state.selectedEdgeIds.size > 0) {
          for (const edgeId of state.selectedEdgeIds) removeEdge(edgeId)
        }
      } else if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        const allIds = useGraphStore.getState().graph.nodes.map((n) => n.id)
        selectNodes(allIds)
        setCanvasNodes((nds) => nds.map((n) => ({ ...n, selected: true })))
      } else if (e.key === ' ' && !e.repeat) {
        e.preventDefault()
        const current = useUIStore.getState().canvasMode
        if (current === 'select') {
          previousMode = 'select'
          setCanvasMode('pan')
        } else {
          previousMode = 'pan'
          setCanvasMode('select')
        }
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && previousMode !== null) {
        setCanvasMode(previousMode)
        previousMode = null
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [removeSelectedNodes, removeEdge, setCanvasMode, selectNodes, setCanvasNodes])

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: CanvasNode) => {
    const target = _event.target as HTMLElement
    if (target.closest('input, textarea, select')) return
    useUIStore.getState().toggleNodeExpanded(node.id)
  }, [])

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
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        edgesReconnectable
        onReconnectStart={onReconnectStart}
        onReconnect={onReconnect}
        onReconnectEnd={onReconnectEnd}
        connectionRadius={CONNECTION_RADIUS}
        panOnDrag={isPanMode ? true : [1, 2]}
        selectionOnDrag={!isPanMode}
        selectionMode={SelectionMode.Partial}
        panOnScroll={false}
        zoomOnScroll
        minZoom={0.1}
        maxZoom={3}
        snapToGrid={snapToGrid}
        snapGrid={SNAP_GRID}
        selectNodesOnDrag={false}
        connectionLineStyle={{ stroke: '#9ca3af', strokeWidth: 2, strokeDasharray: '6,4' }}
        defaultEdgeOptions={{ type: 'component' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={SNAP_GRID_SIZE} size={3} color="var(--grid-color)" />
        <CanvasToolkit />
        <MiniMap position="top-right" pannable zoomable style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }} />
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
