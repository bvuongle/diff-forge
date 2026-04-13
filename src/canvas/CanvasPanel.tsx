import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useGraphStore } from '@state/graphStore'
import { useCatalogStore } from '@state/catalogStore'
import { useUIStore } from '@state/uiStore'
import { CatalogComponent } from '@domain/catalog/CatalogTypes'
import { isEdgeInvalid } from '@domain/graph/GraphOperations'
import { useCanvasInteraction } from './interaction/useCanvasInteraction'
import { useEdgeDrawing } from './edges/useEdgeDrawing'
import { useNodeDrag } from './interaction/useNodeDrag'
import { createNodeFromCatalog, buildSlots } from './nodes/createNodeFromCatalog'
import { CanvasNode } from './nodes/CanvasNode'
import { CanvasEdge, PendingEdge } from './edges/CanvasEdge'
import { NODE_WIDTH_COMPACT } from './canvasConstants'
import { getConnectedSlots } from './nodes/getConnectedSlots'

type MarqueeRect = { startX: number; startY: number; endX: number; endY: number }

function CanvasPanel() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const {
    graph, selectedNodeIds, selectedEdgeId,
    addNode, removeNode, removeEdge, selectNode, selectNodes, selectEdge, clearSelection, removeSelectedNodes, updateNodeVersion
  } = useGraphStore()
  const catalog = useCatalogStore((s) => s.catalog)
  const { expandedNodeIds, toggleNodeExpanded, dragInfo, nodeWidths, setNodeWidth, canvasMode } = useUIStore()
  const { transform, onPanStart, onPanMove, onPanEnd, fitToView, resetView } = useCanvasInteraction(canvasRef)
  const { dragEdge, onPortMouseDown } = useEdgeDrawing(canvasRef, transform.zoom, transform.panX, transform.panY)
  const { onMoveStart } = useNodeDrag(transform.zoom)

  const [marquee, setMarquee] = useState<MarqueeRect | null>(null)

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

  // Dim logic: only active when an edge is selected, to highlight the connected cluster
  const edgeDimNodeIds = useMemo(() => {
    if (!selectedEdgeId) return null
    const edge = graph.edges.find(e => e.id === selectedEdgeId)
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

  const edgeSourceMaps = useMemo(() => {
    const maps: Record<string, Record<string, string[]>> = {}
    for (const edge of graph.edges) {
      const src = graph.nodes.find(n => n.id === edge.sourceNodeId)
      if (!src) continue
      if (!maps[edge.targetNodeId]) maps[edge.targetNodeId] = {}
      const m = maps[edge.targetNodeId]
      if (!m[edge.targetSlot]) m[edge.targetSlot] = []
      m[edge.targetSlot].push(src.instanceId)
    }
    return maps
  }, [graph.nodes, graph.edges])

  const handleVersionChange = useCallback((nodeId: string, version: string) => {
    const node = graph.nodes.find(n => n.id === nodeId)
    if (!node) return
    const comp = catalog?.components.find((c: CatalogComponent) => c.type === node.componentType)
    if (!comp) return
    const schema = comp.versions[version]
    if (!schema) return
    updateNodeVersion(nodeId, version, buildSlots(schema), schema.configSchema)
  }, [graph.nodes, catalog, updateNodeVersion])

  const handleWidthChange = useCallback((nodeId: string, width: number) => {
    setNodeWidth(nodeId, width)
  }, [setNodeWidth])

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
      const component = JSON.parse(raw) as CatalogComponent
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const position = {
        x: (e.clientX - rect.left - transform.panX) / transform.zoom - NODE_WIDTH_COMPACT / 2,
        y: (e.clientY - rect.top - transform.panY) / transform.zoom - 30
      }
      const node = createNodeFromCatalog(component, position, graph.nodes)
      addNode(node)
    },
    [transform, graph.nodes, addNode]
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        if (selectedNodeIds.size > 0) removeSelectedNodes()
        else if (selectedEdgeId) removeEdge(selectedEdgeId)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedNodeIds, selectedEdgeId, removeSelectedNodes, removeEdge])

  useEffect(() => {
    const { setCanvasMode } = useUIStore.getState()
    let previousMode: 'select' | 'pan' | null = null

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'v' || e.key === 'V') setCanvasMode('select')
      else if (e.key === 'h' || e.key === 'H') setCanvasMode('pan')
      else if (e.key === ' ' && !e.repeat) {
        e.preventDefault()
        previousMode = useUIStore.getState().canvasMode
        setCanvasMode('pan')
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
  }, [])

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (target === e.currentTarget || target.hasAttribute('data-canvas-bg')) {
        if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
          if (canvasMode === 'pan') {
            onPanStart(e)
          } else {
            const rect = canvasRef.current?.getBoundingClientRect()
            if (!rect) return
            const x = (e.clientX - rect.left - transform.panX) / transform.zoom
            const y = (e.clientY - rect.top - transform.panY) / transform.zoom
            setMarquee({ startX: x, startY: y, endX: x, endY: y })
          }
        } else {
          onPanStart(e)
        }
      }
    },
    [transform, onPanStart, canvasMode]
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (marquee) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = (e.clientX - rect.left - transform.panX) / transform.zoom
        const y = (e.clientY - rect.top - transform.panY) / transform.zoom
        setMarquee(prev => prev ? { ...prev, endX: x, endY: y } : null)
      } else {
        onPanMove(e)
      }
    },
    [marquee, transform, onPanMove]
  )

  const handleCanvasMouseUp = useCallback(
    () => {
      if (marquee) {
        const left = Math.min(marquee.startX, marquee.endX)
        const right = Math.max(marquee.startX, marquee.endX)
        const top = Math.min(marquee.startY, marquee.endY)
        const bottom = Math.max(marquee.startY, marquee.endY)
        const width = right - left
        const height = bottom - top

        if (width > 5 || height > 5) {
          const enclosed = graph.nodes
            .filter(n => n.position.x >= left && n.position.x + NODE_WIDTH_COMPACT <= right
              && n.position.y >= top && n.position.y + 60 <= bottom)
            .map(n => n.id)
          selectNodes(enclosed)
        } else {
          clearSelection()
        }
        setMarquee(null)
      } else {
        onPanEnd()
      }
    },
    [marquee, graph.nodes, selectNodes, clearSelection, onPanEnd]
  )

  const handleFitToView = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) fitToView(graph.nodes, rect.width, rect.height)
  }, [fitToView, graph.nodes])

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>
    w.__canvasFitToView = handleFitToView
    w.__canvasResetView = resetView
    return () => { delete w.__canvasFitToView; delete w.__canvasResetView }
  }, [handleFitToView, resetView])

  const marqueeStyle = marquee ? {
    left: Math.min(marquee.startX, marquee.endX),
    top: Math.min(marquee.startY, marquee.endY),
    width: Math.abs(marquee.endX - marquee.startX),
    height: Math.abs(marquee.endY - marquee.startY)
  } : null

  return (
    <Box
      ref={canvasRef}
      position="relative"
      overflow="hidden"
      sx={{
        width: '100%', height: '100%', bgcolor: 'background.default',
        cursor: canvasMode === 'pan' ? 'grab' : 'default',
        '&:active': canvasMode === 'pan' ? { cursor: 'grabbing' } : {}
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={() => { setMarquee(null); onPanEnd() }}
    >
      <Box
        data-canvas-bg="true"
        sx={{
          position: 'absolute', inset: 0, transformOrigin: '0 0',
          transform: `translate(${transform.panX}px, ${transform.panY}px) scale(${transform.zoom})`,
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--grid-color) 1px, transparent 0)',
          backgroundSize: '20px 20px', width: 20000, height: 20000
        }}
      >
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
          <g style={{ pointerEvents: 'auto' }}>
            {graph.edges.map((edge) => (
              <CanvasEdge
                key={edge.id} edge={edge} nodes={graph.nodes}
                expandedNodeIds={expandedNodeIds}
                nodeWidths={nodeWidths}
                isSelected={selectedEdgeIds.has(edge.id)}
                isInvalid={isEdgeInvalid(edge, graph.nodes)}
                isDimmed={edgeDimEdgeIds !== null && !edgeDimEdgeIds.has(edge.id)}
                onSelect={selectEdge}
              />
            ))}
          </g>
          {dragEdge && <PendingEdge fromX={dragEdge.fromX} fromY={dragEdge.fromY} toX={dragEdge.toX} toY={dragEdge.toY} />}
        </svg>

        {graph.nodes.map((node) => (
          <CanvasNode
            key={node.id} node={node}
            isSelected={selectedNodeIds.has(node.id)}
            isExpanded={expandedNodeIds.has(node.id)}
            isDimmed={edgeDimNodeIds !== null && !edgeDimNodeIds.has(node.id)}
            connectedSlots={getConnectedSlots(node.id, graph.edges)}
            catalogComponent={catalog?.components.find((c) => c.type === node.componentType) ?? null}
            dragInfo={dragInfo}
            edgeSourceMap={edgeSourceMaps[node.id] ?? {}}
            onSelect={selectNode}
            onMoveStart={onMoveStart}
            onPortMouseDown={onPortMouseDown}
            onToggleExpand={toggleNodeExpanded}
            onVersionChange={handleVersionChange}
            onWidthChange={handleWidthChange}
          />
        ))}

        {marqueeStyle && (
          <Box sx={{
            position: 'absolute', ...marqueeStyle,
            border: '1px solid var(--accent-blue)',
            bgcolor: 'rgba(59, 130, 246, 0.08)',
            pointerEvents: 'none'
          }} />
        )}
      </Box>

      {graph.nodes.length === 0 && (
        <Box position="absolute" sx={{ inset: 0, pointerEvents: 'none' }} display="flex" alignItems="center" justifyContent="center">
          <Box textAlign="center">
            <Typography variant="h6" color="text.secondary" gutterBottom>Canvas</Typography>
            <Typography variant="body2" color="text.secondary">Drag components from the catalog to place nodes.</Typography>
          </Box>
        </Box>
      )}

      <Box position="absolute" bottom={8} right={8} px={1} py={0.5} borderRadius={1} bgcolor="rgba(255,255,255,0.85)" border="1px solid var(--panel-border)">
        <Typography variant="caption" color="text.secondary">{Math.round(transform.zoom * 100)}%</Typography>
      </Box>
    </Box>
  )
}

export { CanvasPanel }
