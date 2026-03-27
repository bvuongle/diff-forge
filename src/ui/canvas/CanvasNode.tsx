import { useRef, useCallback } from 'react'
import { Box, Typography } from '@mui/material'
import { GraphNode, Slot } from '@domain/graph/GraphTypes'
import { NODE_WIDTH } from './CanvasEdge'

type CanvasNodeProps = {
  node: GraphNode
  isSelected: boolean
  connectedSlots: Set<string>
  onSelect: (nodeId: string) => void
  onMoveStart: (nodeId: string, startX: number, startY: number) => void
  onPortMouseDown: (
    e: React.MouseEvent,
    nodeId: string,
    slotName: string,
    portEl: HTMLElement
  ) => void
}

function PortCircle({
  slot,
  nodeId,
  side,
  isConnected,
  onMouseDown
}: {
  slot: Slot
  nodeId: string
  side: 'left' | 'right'
  isConnected: boolean
  onMouseDown: (e: React.MouseEvent, nodeId: string, slotName: string, portEl: HTMLElement) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        flexDirection: side === 'left' ? 'row' : 'row-reverse',
        py: 0.25
      }}
    >
      <Box
        ref={ref}
        data-port-handle="true"
        data-node-id={nodeId}
        data-slot-name={slot.name}
        data-direction={slot.direction}
        onMouseDown={(e) => {
          if (ref.current) onMouseDown(e, nodeId, slot.name, ref.current)
        }}
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: '2px solid',
          borderColor: isConnected ? '#22c55e' : 'var(--panel-border)',
          bgcolor: isConnected ? '#22c55e' : '#fff',
          cursor: 'crosshair',
          flexShrink: 0,
          transition: 'all 0.15s ease',
          '&:hover': {
            borderColor: 'var(--accent-blue)',
            bgcolor: 'var(--accent-blue-light)'
          }
        }}
      />
      <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
        {slot.name}
      </Typography>
    </Box>
  )
}

function CanvasNode({ node, isSelected, connectedSlots, onSelect, onMoveStart, onPortMouseDown }: CanvasNodeProps) {
  const inputSlots = node.slots.filter((s) => s.direction === 'in')
  const outputSlots = node.slots.filter((s) => s.direction === 'out')

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-port-handle]')) return
      e.stopPropagation()
      onSelect(node.id)
      onMoveStart(node.id, e.clientX, e.clientY)
    },
    [node.id, onSelect, onMoveStart]
  )

  return (
    <Box
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
      sx={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        width: NODE_WIDTH,
        bgcolor: 'var(--panel-bg)',
        borderRadius: 2,
        border: '2px solid',
        borderColor: isSelected ? 'var(--accent-blue)' : 'var(--panel-border)',
        boxShadow: isSelected
          ? '0 0 0 3px var(--accent-blue-light)'
          : '0 1px 4px rgba(0,0,0,0.08)',
        cursor: 'grab',
        userSelect: 'none',
        '&:hover': {
          borderColor: isSelected ? 'var(--accent-blue)' : '#bbb'
        }
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: '1px solid var(--panel-border)'
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          {node.componentType}
        </Typography>
        <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
          {node.instanceId}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.5, py: 1, minHeight: 32 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {inputSlots.map((slot) => (
            <PortCircle
              key={slot.name}
              slot={slot}
              nodeId={node.id}
              side="left"
              isConnected={connectedSlots.has(slot.name)}
              onMouseDown={onPortMouseDown}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
          {outputSlots.map((slot) => (
            <PortCircle
              key={slot.name}
              slot={slot}
              nodeId={node.id}
              side="right"
              isConnected={connectedSlots.has(slot.name)}
              onMouseDown={onPortMouseDown}
            />
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export { CanvasNode }
