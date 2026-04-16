import { Box, Chip, Typography } from '@mui/material'
import { Handle, Position } from '@xyflow/react'

import type { Slot } from '@domain/graph/GraphTypes'
import { HANDLE_SIZE, OUT_HANDLE_ID } from '@canvas/canvasConstants'

import { getPortDragState, type DragInfo } from '../ports/portDragState'
import { getSlotTooltip, type EdgeSourceMap } from '../ports/slotUtils'

type NodeRequirementsSectionProps = {
  nodeId: string
  inputSlots: Slot[]
  outputSlots: Slot[]
  connectionCounts: Map<string, number>
  edgeSourceMap: EdgeSourceMap
  dragInfo: DragInfo | null
}

function NodeRequirementsSection({
  nodeId,
  inputSlots,
  outputSlots,
  connectionCounts,
  edgeSourceMap,
  dragInfo
}: NodeRequirementsSectionProps) {
  const hasOutput = outputSlots.length > 0
  const isOutputConnected = outputSlots.some((s) => (connectionCounts.get(s.name) ?? 0) > 0)

  return (
    <Box>
      {inputSlots.map((slot) => {
        const count = connectionCounts.get(slot.name) ?? 0
        const isConnected = count > 0
        const portState = getPortDragState(slot, nodeId, dragInfo)
        const isValid = portState === 'valid'
        const isPortDimmed = portState === 'dimmed'
        const tooltip = getSlotTooltip(edgeSourceMap, slot.name)
        const isConnectable = count < slot.maxConnections
        return (
          <Box
            key={slot.name}
            title={tooltip}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, height: 32 }}
          >
            <HandlePort
              type="target"
              handleId={slot.name}
              isConnected={isConnected}
              isConnectable={isConnectable}
              isValid={isValid}
              isDimmed={isPortDimmed}
              side="left"
            />
            <Typography
              variant="caption"
              color="text.primary"
              noWrap
              sx={{ fontSize: '0.7rem', opacity: isPortDimmed ? 0.3 : 1 }}
            >
              {slot.name}
            </Typography>
            <Chip
              label={slot.interface}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                bgcolor: '#e8eaed',
                color: 'text.secondary',
                opacity: isPortDimmed ? 0.3 : 1,
                '& .MuiChip-label': { px: 0.75 }
              }}
            />
            {slot.maxConnections > 1 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', ml: -0.5 }}>
                {count}/{slot.maxConnections}
              </Typography>
            )}
          </Box>
        )
      })}
      {hasOutput && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, py: 0.5, height: 32 }}>
          {outputSlots.length === 1 && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
              {outputSlots[0].interface}
            </Typography>
          )}
          <HandlePort
            type="source"
            handleId={OUT_HANDLE_ID}
            isConnected={isOutputConnected}
            isConnectable
            isValid={false}
            isDimmed={false}
            side="right"
          />
        </Box>
      )}
    </Box>
  )
}

function HandlePort({
  type,
  handleId,
  isConnected,
  isConnectable,
  isValid,
  isDimmed,
  side
}: {
  type: 'source' | 'target'
  handleId: string
  isConnected: boolean
  isConnectable: boolean
  isValid: boolean
  isDimmed: boolean
  side: 'left' | 'right'
}) {
  const position = side === 'left' ? Position.Left : Position.Right
  const color = isValid ? '#22c55e' : isConnected ? '#22c55e' : '#fff'
  const borderColor = isValid ? '#22c55e' : isConnected ? '#22c55e' : 'var(--panel-border)'

  return (
    <Handle
      type={type}
      position={position}
      id={handleId}
      isConnectable={isConnectable}
      style={{
        position: 'relative',
        top: 'auto',
        left: 'auto',
        right: 'auto',
        transform: 'none',
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        background: color,
        border: `2px solid ${borderColor}`,
        borderRadius: '50%',
        cursor: isConnectable ? 'crosshair' : 'default',
        opacity: isDimmed ? 0.3 : 1,
        transition: 'all 0.15s ease',
        flexShrink: 0
      }}
    />
  )
}

export { NodeRequirementsSection }
