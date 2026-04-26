import { Box, Chip, Typography } from '@mui/material'

import type { Slot } from '@core/graph/GraphTypes'
import { OUT_HANDLE_ID } from '@canvas/canvasConstants'
import { type DragInfo, type EdgeSourceMap } from '@canvas/canvasTypes'

import { getPortDragState, getSlotTooltip } from '../nodeUtils'
import { HandlePort } from './HandlePort'

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
          <Box key={slot.name} title={tooltip} className="slot-row">
            <HandlePort
              nodeId={nodeId}
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
              className={`slot-label ${isPortDimmed ? 'slot-label--dimmed' : ''}`}
            >
              {slot.name}
            </Typography>
            <Chip
              label={slot.interface}
              size="small"
              className={`slot-chip ${isPortDimmed ? 'slot-chip--dimmed' : ''}`}
            />
            {slot.maxConnections > 1 && (
              <Typography variant="caption" color="text.secondary" className="slot-count">
                {count}/{slot.maxConnections}
              </Typography>
            )}
          </Box>
        )
      })}
      {hasOutput && (
        <Box className="slot-row slot-row--output">
          {outputSlots.length === 1 && (
            <Typography variant="caption" color="text.secondary" noWrap className="slot-label slot-label--output">
              {outputSlots[0].interface}
            </Typography>
          )}
          <HandlePort
            nodeId={nodeId}
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

export { NodeRequirementsSection }
