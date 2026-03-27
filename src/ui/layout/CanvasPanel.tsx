import { useCallback, useEffect, useRef } from 'react'
import { Box, Typography } from '@mui/material'
import { useGraphStore } from '@state/graphStore'
import { CatalogComponent } from '@domain/catalog/CatalogTypes'
import { useCanvasInteraction } from '@ui/canvas/useCanvasInteraction'
import { useEdgeDrawing } from '@ui/canvas/useEdgeDrawing'
import { useNodeDrag } from '@ui/canvas/useNodeDrag'
import { createNodeFromCatalog } from '@ui/canvas/createNodeFromCatalog'
import { CanvasNode } from '@ui/canvas/CanvasNode'
import { CanvasEdge, PendingEdge, NODE_WIDTH } from '@ui/canvas/CanvasEdge'
import { getConnectedSlots } from '@ui/canvas/getConnectedSlots'

function CanvasPanel() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const { graph, selectedNodeId, selectedEdgeId, addNode, removeNode, removeEdge, selectNode, selectEdge } =
    useGraphStore()

  const selectedEdgeObj = selectedEdgeId ? graph.edges.find((e) => e.id === selectedEdgeId) : null
  const highlightedNodeIds = new Set<string>()
  if (selectedEdgeObj) {
    highlightedNodeIds.add(selectedEdgeObj.sourceNodeId)
    highlightedNodeIds.add(selectedEdgeObj.targetNodeId)
  }
  if (selectedNodeId) highlightedNodeIds.add(selectedNodeId)

  const { transform, onWheel, onPanStart, onPanMove, onPanEnd } = useCanvasInteraction()
  const { dragEdge, onPortMouseDown } = useEdgeDrawing(canvasRef, transform.zoom, transform.panX, transform.panY)
  const { onMoveStart } = useNodeDrag(transform.zoom)

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
        x: (e.clientX - rect.left - transform.panX) / transform.zoom - NODE_WIDTH / 2,
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
        if ((e.target as HTMLElement).tagName === 'INPUT') return
        if (selectedNodeId) {
          removeNode(selectedNodeId)
        } else if (selectedEdgeId) {
          removeEdge(selectedEdgeId)
        }
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

  return (
    <Box
      ref={canvasRef}
      position="relative"
      overflow="hidden"
      sx={{ width: '100%', height: '100%', bgcolor: 'background.default' }}
      onWheel={onWheel}
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
          position: 'absolute',
          inset: 0,
          transformOrigin: '0 0',
          transform: `translate(${transform.panX}px, ${transform.panY}px) scale(${transform.zoom})`,
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--grid-color) 1px, transparent 0)',
          backgroundSize: '20px 20px',
          minWidth: '200%',
          minHeight: '200%'
        }}
      >
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'visible'
          }}
        >
          <g style={{ pointerEvents: 'auto' }}>
            {graph.edges.map((edge) => (
              <CanvasEdge
                key={edge.id}
                edge={edge}
                nodes={graph.nodes}
                isSelected={selectedEdgeId === edge.id}
                onSelect={selectEdge}
              />
            ))}
          </g>
          {dragEdge && (
            <PendingEdge fromX={dragEdge.fromX} fromY={dragEdge.fromY} toX={dragEdge.toX} toY={dragEdge.toY} />
          )}
        </svg>

        {graph.nodes.map((node) => (
          <CanvasNode
            key={node.id}
            node={node}
            isSelected={highlightedNodeIds.has(node.id)}
            connectedSlots={getConnectedSlots(node.id, graph.edges)}
            onSelect={selectNode}
            onMoveStart={onMoveStart}
            onPortMouseDown={onPortMouseDown}
          />
        ))}
      </Box>

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

      <Box
        position="absolute"
        bottom={8}
        right={8}
        px={1}
        py={0.5}
        borderRadius={1}
        bgcolor="rgba(255,255,255,0.85)"
        border="1px solid var(--panel-border)"
      >
        <Typography variant="caption" color="text.secondary">
          {Math.round(transform.zoom * 100)}%
        </Typography>
      </Box>
    </Box>
  )
}

export { CanvasPanel }
