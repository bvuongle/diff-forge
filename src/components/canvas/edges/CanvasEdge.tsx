import { GraphEdge, GraphNode } from '@domain/graph/GraphTypes'
import { useUIStore } from '@state/uiStore'
import { makePortKey } from '@canvas/nodes/ports/portRegistry'

type CanvasEdgeProps = {
  edge: GraphEdge
  nodes: GraphNode[]
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
  portOffsets: Record<string, { offsetX: number; offsetY: number }>
): PortPosition | null {
  const key = makePortKey(node.id, slotName, direction)
  const offset = portOffsets[key]
  if (!offset) return null
  return {
    x: node.position.x + offset.offsetX,
    y: node.position.y + offset.offsetY
  }
}

function buildCurvePath(from: PortPosition, to: PortPosition): string {
  const dx = Math.abs(to.x - from.x) * 0.5
  return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`
}

function CanvasEdge({ edge, nodes, isSelected, isInvalid, isDimmed, onSelect }: CanvasEdgeProps) {
  const portOffsets = useUIStore((s) => s.portOffsets)

  const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId)
  const targetNode = nodes.find((n) => n.id === edge.targetNodeId)
  if (!sourceNode || !targetNode) return null

  // Try exact source slot first, fall back to __out__ (compact mode output port)
  const from =
    getPortPosition(sourceNode, edge.sourceSlot, 'out', portOffsets) ??
    getPortPosition(sourceNode, '__out__', 'out', portOffsets)
  const to = getPortPosition(targetNode, edge.targetSlot, 'in', portOffsets)

  if (!from || !to) return null

  const path = buildCurvePath(from, to)
  const strokeColor = isInvalid ? '#ef4444' : isSelected ? 'var(--accent-blue)' : '#9ca3af'

  const srcOutputSlots = sourceNode.slots.filter((s) => s.direction === 'out')
  const showEdgeLabel = srcOutputSlots.length > 1
  const edgeLabelIndex = srcOutputSlots.findIndex((s) => s.name === edge.sourceSlot)

  return (
    <g
      onClick={(e) => {
        e.stopPropagation()
        onSelect(edge.id)
      }}
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
    <path
      d={path}
      fill="none"
      stroke="#9ca3af"
      strokeWidth={2}
      strokeDasharray="6,4"
      strokeLinecap="round"
      pointerEvents="none"
    />
  )
}

export { CanvasEdge, PendingEdge }
