import { useEffect, useMemo, useRef } from 'react'

import { Box, Typography } from '@mui/material'

import { GraphNode, Slot } from '@domain/graph/GraphTypes'
import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'

import { getConnectedSlots } from '../ports/getConnectedSlots'
import { registerPort, unregisterPort } from '../ports/portRegistry'
import { PortRow } from '../ports/PortRow'
import { getEdgeSourceMap, getSlotTooltip } from '../ports/slotUtils'

type NodeRequirementsSectionProps = {
  node: GraphNode
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, slotName: string, portEl: HTMLElement) => void
}

function OutputPortRow({
  nodeId,
  outputSlots,
  connectedSlots,
  onPortMouseDown
}: {
  nodeId: string
  outputSlots: Slot[]
  connectedSlots: Set<string>
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, slotName: string, portEl: HTMLElement) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) registerPort(nodeId, '__out__', 'out', ref.current)
    return () => unregisterPort(nodeId, '__out__', 'out')
  }, [nodeId])

  const isConnected = outputSlots.some((s) => connectedSlots.has(s.name))
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, py: 0.5, height: 32 }}>
      {outputSlots.length === 1 && (
        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
          {outputSlots[0].interface}
        </Typography>
      )}
      <Box
        ref={ref}
        data-port-handle="true"
        data-node-id={nodeId}
        data-slot-name="__out__"
        data-direction="out"
        onMouseDown={(e) => {
          if (ref.current) onPortMouseDown(e, nodeId, '__out__', ref.current)
        }}
        sx={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '2px solid',
          borderColor: isConnected ? '#22c55e' : 'var(--panel-border)',
          bgcolor: isConnected ? '#22c55e' : '#fff',
          cursor: 'crosshair',
          flexShrink: 0,
          transition: 'all 0.15s ease',
          '&:hover': { borderColor: 'var(--accent-blue)', bgcolor: 'var(--accent-blue-light)', transform: 'scale(1.2)' }
        }}
      />
    </Box>
  )
}

export function NodeRequirementsSection({ node, onPortMouseDown }: NodeRequirementsSectionProps) {
  const edges = useGraphStore((s) => s.graph.edges)
  const nodes = useGraphStore((s) => s.graph.nodes)
  const dragInfo = useUIStore((s) => s.dragInfo)

  const connectedSlots = useMemo(() => getConnectedSlots(node.id, edges), [node.id, edges])
  const edgeSourceMap = useMemo(() => getEdgeSourceMap(node.id, { nodes, edges }), [node.id, nodes, edges])

  const inputSlots = node.slots.filter((s) => s.direction === 'in')
  const outputSlots = node.slots.filter((s) => s.direction === 'out')

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
        REQUIREMENTS
      </Typography>
      <Box mt={0.5}>
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
        {outputSlots.length > 0 && (
          <OutputPortRow
            nodeId={node.id}
            outputSlots={outputSlots}
            connectedSlots={connectedSlots}
            onPortMouseDown={onPortMouseDown}
          />
        )}
      </Box>
    </Box>
  )
}
