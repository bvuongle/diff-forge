import { useCallback, useEffect, useRef } from 'react'

import { Box, Typography } from '@mui/material'

import { isEdgeInvalid } from '@domain/graph/GraphOperations'
import { useCatalogStore } from '@state/catalogStore'
import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'

import { CanvasMarquee } from './CanvasMarquee'
import { CanvasEdge, PendingEdge } from './edges/CanvasEdge'
import { useEdgeDrawing } from './edges/useEdgeDrawing'
import { useCanvasDnD } from './interaction/useCanvasDnD'
import { useCanvasHotkeys } from './interaction/useCanvasHotkeys'
import { useCanvasInteraction } from './interaction/useCanvasInteraction'
import { useCanvasMarquee } from './interaction/useCanvasMarquee'
import { useCanvasSelection } from './interaction/useCanvasSelection'
import { useNodeDrag } from './interaction/useNodeDrag'
import { CanvasNode } from './nodes/CanvasNode'
import { getConnectedSlots } from './nodes/ports/getConnectedSlots'

function CanvasPanel() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const { graph, selectedNodeIds, selectedEdgeId, addNode, selectNode, selectNodes, selectEdge, clearSelection } =
    useGraphStore()
  const catalog = useCatalogStore((s) => s.catalog)
  const { expandedNodeIds, toggleNodeExpanded, dragInfo, setNodeWidth, canvasMode } = useUIStore()

  const { transform, onPanStart, onPanMove, onPanEnd, fitToView, resetView } = useCanvasInteraction(canvasRef)
  const { dragEdge, onPortMouseDown } = useEdgeDrawing(canvasRef, transform.zoom, transform.panX, transform.panY)
  const { onMoveStart } = useNodeDrag(transform.zoom)

  useCanvasHotkeys()
  const { marquee, startMarquee, updateMarquee, endMarquee, setMarquee } = useCanvasMarquee(
    canvasRef,
    transform,
    graph.nodes,
    selectNodes,
    clearSelection
  )
  const { onDragOver, onDrop } = useCanvasDnD(canvasRef, transform, graph.nodes, addNode)
  const { selectedEdgeIds, edgeDimNodeIds, edgeDimEdgeIds, edgeSourceMaps } = useCanvasSelection(
    graph,
    selectedNodeIds,
    selectedEdgeId
  )

  const setFitToViewAction = useUIStore((s) => s.setFitToViewAction)
  const setResetViewAction = useUIStore((s) => s.setResetViewAction)

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (target === e.currentTarget || target.hasAttribute('data-canvas-bg')) {
        if (e.button === 0 && !e.ctrlKey && !e.metaKey && canvasMode !== 'pan') {
          startMarquee(e)
        } else {
          onPanStart(e)
        }
      }
    },
    [onPanStart, startMarquee, canvasMode]
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (marquee) updateMarquee(e)
      else onPanMove(e)
    },
    [marquee, updateMarquee, onPanMove]
  )

  const handleCanvasMouseUp = useCallback(() => {
    if (marquee) endMarquee()
    else onPanEnd()
  }, [marquee, endMarquee, onPanEnd])

  const handleFitToView = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) fitToView(graph.nodes, rect.width, rect.height)
  }, [fitToView, graph.nodes])

  useEffect(() => {
    setFitToViewAction(handleFitToView)
    setResetViewAction(resetView)
    return () => {
      setFitToViewAction(null)
      setResetViewAction(null)
    }
  }, [handleFitToView, resetView, setFitToViewAction, setResetViewAction])

  return (
    <Box
      ref={canvasRef}
      position="relative"
      overflow="hidden"
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: 'background.default',
        cursor: canvasMode === 'pan' ? 'grab' : 'default',
        '&:active': canvasMode === 'pan' ? { cursor: 'grabbing' } : {}
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={() => {
        setMarquee(null)
        onPanEnd()
      }}
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
          width: 20000,
          height: 20000
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
                isSelected={selectedEdgeIds.has(edge.id)}
                isInvalid={isEdgeInvalid(edge, graph.nodes)}
                isDimmed={edgeDimEdgeIds !== null && !edgeDimEdgeIds.has(edge.id)}
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
            isSelected={selectedNodeIds.has(node.id)}
            isExpanded={expandedNodeIds.has(node.id)}
            isDimmed={edgeDimNodeIds !== null && !edgeDimNodeIds.has(node.id)}
            connectedSlots={getConnectedSlots(node.id, graph.edges)}
            catalogComponent={
              catalog?.components.find((c) => c.type === node.componentType && c.version === node.version) ?? null
            }
            dragInfo={dragInfo}
            edgeSourceMap={edgeSourceMaps[node.id] ?? {}}
            onSelect={selectNode}
            onMoveStart={onMoveStart}
            onPortMouseDown={onPortMouseDown}
            onToggleExpand={toggleNodeExpanded}
            onWidthChange={setNodeWidth}
          />
        ))}

        {marquee && <CanvasMarquee marquee={marquee} />}
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
