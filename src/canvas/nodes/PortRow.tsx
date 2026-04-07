import { useRef } from 'react'
import { Box, Chip, Tooltip, Typography } from '@mui/material'
import { Slot } from '@domain/graph/GraphTypes'

type DragInfo = { sourceNodeId: string; sourceInterfaces: string[] }

type PortRowProps = {
  slot: Slot
  nodeId: string
  side: 'left' | 'right'
  isConnected: boolean
  dragInfo: DragInfo | null
  tooltipText: string
  hideLabel?: boolean
  onMouseDown: (e: React.MouseEvent, nodeId: string, slotName: string, portEl: HTMLElement) => void
}

function getPortDragState(slot: Slot, nodeId: string, dragInfo: DragInfo | null): 'idle' | 'valid' | 'dimmed' {
  if (!dragInfo) return 'idle'
  if (nodeId === dragInfo.sourceNodeId) return 'dimmed'
  if (slot.direction === 'out') return 'dimmed'
  return dragInfo.sourceInterfaces.includes(slot.interface) ? 'valid' : 'dimmed'
}

function PortRow({ slot, nodeId, side, isConnected, dragInfo, tooltipText, hideLabel, onMouseDown }: PortRowProps) {
  const ref = useRef<HTMLDivElement>(null)
  const dragState = getPortDragState(slot, nodeId, dragInfo)
  const isValid = dragState === 'valid'
  const isDragDimmed = dragState === 'dimmed'

  const portSx = {
    width: 16, height: 16, borderRadius: '50%', border: '2px solid',
    borderColor: isValid ? '#22c55e' : isConnected ? '#22c55e' : 'var(--panel-border)',
    bgcolor: isValid ? '#22c55e' : isConnected ? '#22c55e' : '#fff',
    cursor: 'crosshair', flexShrink: 0, transition: 'all 0.15s ease',
    opacity: isDragDimmed ? 0.3 : 1,
    animation: isValid ? 'portPulse 1s ease-in-out infinite' : 'none',
    '@keyframes portPulse': {
      '0%': { boxShadow: '0 0 0 0 rgba(34,197,94,0.5)' },
      '70%': { boxShadow: '0 0 0 8px rgba(34,197,94,0)' },
      '100%': { boxShadow: '0 0 0 0 rgba(34,197,94,0)' }
    },
    '&:hover': isDragDimmed ? {} : {
      borderColor: 'var(--accent-blue)', bgcolor: 'var(--accent-blue-light)', transform: 'scale(1.2)'
    }
  }

  const row = (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1, py: 0.5, height: 32,
      flexDirection: side === 'left' ? 'row' : 'row-reverse'
    }}>
      <Box
        ref={ref}
        data-port-handle="true"
        data-node-id={nodeId}
        data-slot-name={slot.name}
        data-direction={slot.direction}
        onMouseDown={(e) => { if (ref.current && !isDragDimmed) onMouseDown(e, nodeId, slot.name, ref.current) }}
        sx={portSx}
      />
      {!hideLabel && side === 'left' && (
        <>
          <Typography variant="caption" color="text.primary" noWrap sx={{ fontSize: '0.7rem', opacity: isDragDimmed ? 0.3 : 1 }}>
            {slot.name}
          </Typography>
          <Chip
            label={slot.interface}
            size="small"
            sx={{
              height: 20, fontSize: '0.65rem', bgcolor: '#e8eaed', color: 'text.secondary',
              opacity: isDragDimmed ? 0.3 : 1, '& .MuiChip-label': { px: 0.75 }
            }}
          />
        </>
      )}
      {!hideLabel && side === 'right' && (
        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem', opacity: isDragDimmed ? 0.3 : 1 }}>
          {slot.interface}
        </Typography>
      )}
    </Box>
  )

  if (tooltipText) {
    return <Tooltip title={tooltipText} placement={side === 'left' ? 'left' : 'right'} arrow>{row}</Tooltip>
  }
  return row
}

export { PortRow, getPortDragState }
export type { DragInfo }
