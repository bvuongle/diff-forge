import { GraphEdge, GraphNode } from '@domain/graph/GraphTypes'

type CanvasEdgeProps = {
  edge: GraphEdge
  nodes: GraphNode[]
  isSelected: boolean
  onSelect: (edgeId: string) => void
}

type PortPosition = { x: number; y: number }

const NODE_WIDTH = 220
const PORT_RADIUS = 6
const HEADER_HEIGHT = 52
const PORT_SPACING = 24
const PORT_TOP_OFFSET = 12

function getPortPosition(
  node: GraphNode,
  slotName: string,
  direction: 'in' | 'out'
): PortPosition {
  const slots = node.slots.filter((s) => s.direction === direction)
  const idx = slots.findIndex((s) => s.name === slotName)
  if (idx === -1) return { x: node.position.x, y: node.position.y }

  const x =
    direction === 'out'
      ? node.position.x + NODE_WIDTH + PORT_RADIUS
      : node.position.x - PORT_RADIUS
  const y = node.position.y + HEADER_HEIGHT + PORT_TOP_OFFSET + idx * PORT_SPACING

  return { x, y }
}

function buildCurvePath(from: PortPosition, to: PortPosition): string {
  const dx = Math.abs(to.x - from.x) * 0.5
  return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`
}

function CanvasEdge({ edge, nodes, isSelected, onSelect }: CanvasEdgeProps) {
  const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId)
  const targetNode = nodes.find((n) => n.id === edge.targetNodeId)
  if (!sourceNode || !targetNode) return null

  const from = getPortPosition(sourceNode, edge.sourceSlot, 'out')
  const to = getPortPosition(targetNode, edge.targetSlot, 'in')
  const path = buildCurvePath(from, to)

  return (
    <g onClick={(e) => { e.stopPropagation(); onSelect(edge.id) }}>
      <path d={path} fill="none" stroke="transparent" strokeWidth={12} style={{ cursor: 'pointer' }} />
      {isSelected && (
        <path d={path} fill="none" stroke="var(--accent-blue)" strokeWidth={6} strokeLinecap="round" opacity={0.2} />
      )}
      <path
        d={path}
        fill="none"
        stroke={isSelected ? 'var(--accent-blue)' : 'var(--text-tertiary)'}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </g>
  )
}

type PendingEdgeProps = {
  fromX: number
  fromY: number
  toX: number
  toY: number
}

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

export { CanvasEdge, PendingEdge, NODE_WIDTH }
