import { GraphEdge, GraphNode } from '@domain/graph/GraphTypes'
import {
  NODE_WIDTH_COMPACT, NODE_WIDTH_EXPANDED, PORT_RADIUS,
  HEADER_HEIGHT_COMPACT, PORT_SPACING, COMPACT_PORT_TOP, EXPANDED_PORT_TOP
} from '@canvas/canvasConstants'

type CanvasEdgeProps = {
  edge: GraphEdge
  nodes: GraphNode[]
  expandedNodeIds: Set<string>
  nodeWidths: Record<string, number>
  isSelected: boolean
  isInvalid: boolean
  isDimmed: boolean
  onSelect: (edgeId: string) => void
}

type PortPosition = { x: number; y: number }

function getPortPosition(
  node: GraphNode,
  slotName: string,
  direction: 'in' | 'out',
  isExpanded: boolean,
  nodeWidth?: number
): PortPosition {
  const fallbackWidth = isExpanded ? NODE_WIDTH_EXPANDED : NODE_WIDTH_COMPACT
  const width = nodeWidth ?? fallbackWidth
  const inputSlots = node.slots.filter((s) => s.direction === 'in')

  const baseY = isExpanded ? EXPANDED_PORT_TOP : HEADER_HEIGHT_COMPACT + COMPACT_PORT_TOP

  if (direction === 'out') {
    const x = node.position.x + width + PORT_RADIUS
    const y = node.position.y + baseY + inputSlots.length * PORT_SPACING
    return { x, y }
  }

  const idx = inputSlots.findIndex((s) => s.name === slotName)
  const slotIdx = idx === -1 ? 0 : idx
  const x = node.position.x - PORT_RADIUS
  const y = node.position.y + baseY + slotIdx * PORT_SPACING
  return { x, y }
}

function buildCurvePath(from: PortPosition, to: PortPosition): string {
  const dx = Math.abs(to.x - from.x) * 0.5
  return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`
}

function CanvasEdge({ edge, nodes, expandedNodeIds, nodeWidths, isSelected, isInvalid, isDimmed, onSelect }: CanvasEdgeProps) {
  const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId)
  const targetNode = nodes.find((n) => n.id === edge.targetNodeId)
  if (!sourceNode || !targetNode) return null

  const from = getPortPosition(sourceNode, edge.sourceSlot, 'out', expandedNodeIds.has(edge.sourceNodeId), nodeWidths[edge.sourceNodeId])
  const to = getPortPosition(targetNode, edge.targetSlot, 'in', expandedNodeIds.has(edge.targetNodeId), nodeWidths[edge.targetNodeId])
  const path = buildCurvePath(from, to)

  const strokeColor = isInvalid
    ? '#ef4444'
    : isSelected ? 'var(--accent-blue)' : '#9ca3af'

  const srcOutputSlots = sourceNode.slots.filter(s => s.direction === 'out')
  const showEdgeLabel = srcOutputSlots.length > 1
  const edgeLabelIndex = srcOutputSlots.findIndex(s => s.name === edge.sourceSlot)

  return (
    <g
      onClick={(e) => { e.stopPropagation(); onSelect(edge.id) }}
      opacity={isDimmed ? 0.15 : 1}
      style={{ transition: 'opacity 0.2s ease' }}
    >
      <path d={path} fill="none" stroke="transparent" strokeWidth={12} style={{ cursor: 'pointer' }} />
      {isSelected && (
        <path d={path} fill="none" stroke="var(--accent-blue)" strokeWidth={6} strokeLinecap="round" opacity={0.2} />
      )}
      {isInvalid && !isSelected && (
        <path d={path} fill="none" stroke="#ef4444" strokeWidth={6} strokeLinecap="round" opacity={0.15} />
      )}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={isInvalid ? '6,4' : undefined}
      />
      {showEdgeLabel && (
        <text
          x={from.x + 12}
          y={from.y - 6 + edgeLabelIndex * 14}
          fontSize="10"
          fill="var(--text-secondary)"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {edge.sourceSlot}
        </text>
      )}
    </g>
  )
}

type PendingEdgeProps = { fromX: number; fromY: number; toX: number; toY: number }

function PendingEdge({ fromX, fromY, toX, toY }: PendingEdgeProps) {
  const dx = Math.abs(toX - fromX) * 0.5
  const path = `M ${fromX} ${fromY} C ${fromX + dx} ${fromY}, ${toX - dx} ${toY}, ${toX} ${toY}`
  return (
    <path d={path} fill="none" stroke="#9ca3af" strokeWidth={2}
      strokeDasharray="6,4" strokeLinecap="round" pointerEvents="none" />
  )
}

export { CanvasEdge, PendingEdge }
