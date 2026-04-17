import { useCallback, useEffect, useMemo, useRef } from 'react'

import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material'

import { CatalogComponent } from '@domain/catalog/CatalogTypes'
import { GraphNode } from '@domain/graph/GraphTypes'
import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'
import { NODE_WIDTH_COMPACT, NODE_WIDTH_EXPANDED } from '@canvas/canvasConstants'

import { NodeExpandedContent } from './NodeExpandedContent'
import { getConnectedSlots } from './ports/getConnectedSlots'
import { registerPort, unregisterPort } from './ports/portRegistry'
import { PortRow } from './ports/PortRow'
import { getEdgeSourceMap, getSlotTooltip } from './ports/slotUtils'

type CanvasNodeProps = {
  node: GraphNode
  isSelected: boolean
  isExpanded: boolean
  isDimmed: boolean
  catalogComponent: CatalogComponent | null
  onSelect: (nodeId: string | null, additive?: boolean) => void
  onMoveStart: (nodeId: string, startX: number, startY: number) => void
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, slotName: string, portEl: HTMLElement) => void
  onToggleExpand: (nodeId: string) => void
  onWidthChange: (nodeId: string, width: number) => void
}

function CanvasNode({
  node,
  isSelected,
  isExpanded,
  isDimmed,
  catalogComponent,
  onSelect,
  onMoveStart,
  onPortMouseDown,
  onToggleExpand,
  onWidthChange
}: CanvasNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const edges = useGraphStore((s) => s.graph.edges)
  const nodes = useGraphStore((s) => s.graph.nodes)
  const dragInfo = useUIStore((s) => s.dragInfo)

  const connectedSlots = useMemo(() => getConnectedSlots(node.id, edges), [node.id, edges])
  const edgeSourceMap = useMemo(() => getEdgeSourceMap(node.id, { nodes, edges }), [node.id, nodes, edges])

  const inputSlots = node.slots.filter((s) => s.direction === 'in')
  const outputSlots = node.slots.filter((s) => s.direction === 'out')
  const hasOutput = outputSlots.length > 0
  const minWidth = isExpanded ? NODE_WIDTH_EXPANDED : NODE_WIDTH_COMPACT

  useEffect(() => {
    const el = nodeRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.borderBoxSize?.[0]?.inlineSize ?? el.offsetWidth
      onWidthChange(node.id, w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [node.id, onWidthChange])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-port-handle]')) return
      if ((e.target as HTMLElement).closest('[data-no-drag]')) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      e.stopPropagation()
      onSelect(node.id, e.ctrlKey || e.metaKey)
      onMoveStart(node.id, e.clientX, e.clientY)
    },
    [node.id, onSelect, onMoveStart]
  )

  const isOutputConnected = outputSlots.some((s) => connectedSlots.has(s.name))
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (outputRef.current && !isExpanded) registerPort(node.id, '__out__', 'out', outputRef.current)
    return () => unregisterPort(node.id, '__out__', 'out')
  }, [node.id, isExpanded])

  const outputPortSx = {
    width: 16,
    height: 16,
    borderRadius: '50%',
    border: '2px solid',
    borderColor: isOutputConnected ? '#22c55e' : 'var(--panel-border)',
    bgcolor: isOutputConnected ? '#22c55e' : '#fff',
    cursor: 'crosshair',
    flexShrink: 0,
    transition: 'all 0.15s ease',
    '&:hover': {
      borderColor: 'var(--accent-blue)',
      bgcolor: 'var(--accent-blue-light)',
      transform: 'scale(1.2)'
    }
  }

  return (
    <Box
      ref={nodeRef}
      data-node-id={node.id}
      data-node-container
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation()
        const target = e.target as HTMLElement
        if (target.closest('input, textarea, select')) return
        onToggleExpand(node.id)
      }}
      onClick={(e) => e.stopPropagation()}
      sx={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        minWidth,
        width: 'fit-content',
        bgcolor: 'var(--panel-bg)',
        borderRadius: 2,
        border: '2px solid',
        borderColor: isSelected ? 'var(--accent-blue)' : 'var(--panel-border)',
        boxShadow: isSelected ? '0 0 0 3px var(--accent-blue-light)' : '0 1px 4px rgba(0,0,0,0.08)',
        cursor: 'grab',
        userSelect: 'none',
        transition: 'opacity 0.2s ease',
        opacity: isDimmed ? 0.3 : 1,
        zIndex: isSelected ? 10 : 1,
        '&:hover': { borderColor: isSelected ? 'var(--accent-blue)' : '#bbb' }
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }} noWrap>
              {node.componentType}
            </Typography>
            <Chip
              label={node.version}
              size="small"
              sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#e8eaed', '& .MuiChip-label': { px: 0.75 } }}
            />
          </Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.3, mt: 0.25 }} noWrap>
            {node.instanceId}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand(node.id)
          }}
          sx={{ mt: -0.25, mr: -0.5 }}
        >
          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      {isExpanded && catalogComponent && (
        <NodeExpandedContent node={node} catalogComponent={catalogComponent} onPortMouseDown={onPortMouseDown} />
      )}

      {!isExpanded && (
        <Box sx={{ px: 1.5, py: 1 }}>
          {inputSlots.map((slot) => (
            <PortRow
              key={slot.name}
              slot={slot}
              nodeId={node.id}
              side="left"
              isConnected={connectedSlots.has(slot.name)}
              dragInfo={dragInfo}
              tooltipText={getSlotTooltip(edgeSourceMap, slot.name)}
              onMouseDown={onPortMouseDown}
            />
          ))}
          {hasOutput && (
            <Tooltip title="" placement="right" arrow>
              <Box
                sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, py: 0.5, height: 32 }}
              >
                {outputSlots.length === 1 && (
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
                    {outputSlots[0].interface}
                  </Typography>
                )}
                <Box
                  ref={outputRef}
                  data-port-handle="true"
                  data-node-id={node.id}
                  data-slot-name="__out__"
                  data-direction="out"
                  onMouseDown={(e) => {
                    if (outputRef.current) onPortMouseDown(e, node.id, '__out__', outputRef.current)
                  }}
                  sx={outputPortSx}
                />
              </Box>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  )
}

export { CanvasNode }
