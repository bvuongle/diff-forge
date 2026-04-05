import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Box, Typography } from '@mui/material'
import { useGraphStore } from '@state/graphStore'
import { useCatalogStore } from '@state/catalogStore'
import { useUIStore } from '@state/uiStore'
import { CatalogComponent } from '@domain/catalog/CatalogTypes'
import { isEdgeInvalid } from '@domain/graph/GraphOperations'
import { useCanvasInteraction } from '@ui/canvas/useCanvasInteraction'
import { useEdgeDrawing } from '@ui/canvas/useEdgeDrawing'
import { useNodeDrag } from '@ui/canvas/useNodeDrag'
import { createNodeFromCatalog, buildSlots } from '@ui/canvas/createNodeFromCatalog'
import { CanvasNode } from '@ui/canvas/CanvasNode'
import { CanvasEdge, PendingEdge, NODE_WIDTH_COMPACT } from '@ui/canvas/CanvasEdge'
import { getConnectedSlots } from '@ui/canvas/getConnectedSlots'

function CanvasPanel() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const {
    graph, selectedNodeId, selectedEdgeId,
    addNode, removeNode, removeEdge, selectNode, selectEdge, updateNodeVersion
  } = useGraphStore()
  const catalog = useCatalogStore((s) => s.catalog)
  const { expandedNodeIds, toggleNodeExpanded, dragInfo, nodeWidths, setNodeWidth } = useUIStore()
  const { transform, onPanStart, onPanMove, onPanEnd, fitToView } = useCanvasInteraction(canvasRef)
  const { dragEdge, onPortMouseDown } = useEdgeDrawing(canvasRef, transform.zoom, transform.panX, transform.panY)
  const { onMoveStart } = useNodeDrag(transform.zoom)

  // Selection-related node IDs for dimming
  const relatedNodeIds = useMemo(() => {
    const related = new Set<string>()
    if (selectedNodeId) {
      related.add(selectedNodeId)
      for (const e of graph.edges) {
        if (e.sourceNodeId === selectedNodeId) related.add(e.targetNodeId)
        if (e.targetNodeId === selectedNodeId) related.add(e.sourceNodeId)
      }
    }
    if (selectedEdgeId) {
      const edge = graph.edges.find(e => e.id === selectedEdgeId)
      if (edge) {
        related.add(edge.sourceNodeId)
        related.add(edge.targetNodeId)
      }
    }
    return related
  }, [selectedNodeId, selectedEdgeId, graph.edges])

  const hasSelection = selectedNodeId !== null || selectedEdgeId !== null

  const relatedEdgeIds = useMemo(() => {
    const related = new Set<string>()
    if (selectedEdgeId) related.add(selectedEdgeId)
    if (selectedNodeId) {
      for (const e of graph.edges) {
        if (e.sourceNodeId === selectedNodeId || e.targetNodeId === selectedNodeId) {
          related.add(e.id)
        }
      }
    }
    return related
  }, [selectedNodeId, selectedEdgeId, graph.edges])

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
        if (selectedNodeId) removeNode(selectedNodeId)
        else if (selectedEdgeId) removeEdge(selectedEdgeId)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedNodeId, selectedEdgeId, removeNode, removeEdge])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-canvas-bg]')) {
        selectNode(null)
        selectEdge(null)
      }
    },
    [selectNode, selectEdge]
  )

  const handleFitToView = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) fitToView(graph.nodes, rect.width, rect.height)
  }, [fitToView, graph.nodes])

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__canvasFitToView = handleFitToView
    return () => { delete (window as unknown as Record<string, unknown>).__canvasFitToView }
  }, [handleFitToView])

  return (
    <Box
      ref={canvasRef}
      position="relative"
      overflow="hidden"
      sx={{ width: '100%', height: '100%', bgcolor: 'background.default' }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).hasAttribute('data-canvas-bg')) {
          onPanStart(e)
        }
      }}
      onMouseMove={onPanMove}
      onMouseUp={onPanEnd}
      onMouseLeave={onPanEnd}
      onClick={handleCanvasClick}
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
                isSelected={selectedEdgeId === edge.id}
                isInvalid={isEdgeInvalid(edge, graph.nodes)}
                isDimmed={hasSelection && !relatedEdgeIds.has(edge.id)}
                onSelect={selectEdge}
              />
            ))}
          </g>
          {dragEdge && <PendingEdge fromX={dragEdge.fromX} fromY={dragEdge.fromY} toX={dragEdge.toX} toY={dragEdge.toY} />}
        </svg>

        {graph.nodes.map((node) => (
          <CanvasNode
            key={node.id} node={node}
            isSelected={hasSelection ? relatedNodeIds.has(node.id) : false}
            isExpanded={expandedNodeIds.has(node.id)}
            isDimmed={hasSelection && !relatedNodeIds.has(node.id)}
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
