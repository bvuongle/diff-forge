import { memo, useMemo } from 'react'

import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'

import { isEdgeInvalid } from '@domain/graph/GraphOperations'
import { useGraphStore } from '@state/graphStore'
import type { CanvasEdge } from '@canvas/canvasTypes'

import { isEdgeDimmed } from '../selection/selectionDimming'

const EDGE_WIDTH = 2

function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data
}: EdgeProps<CanvasEdge>) {
  const graphEdge = data?.graphEdge
  const nodes = useGraphStore((s) => s.graph.nodes)
  const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds)
  const selectedEdgeIds = useGraphStore((s) => s.selectedEdgeIds)

  const isInvalid = useMemo(() => (graphEdge ? isEdgeInvalid(graphEdge, nodes) : false), [graphEdge, nodes])

  const isSelected =
    selected ||
    selectedEdgeIds.has(id) ||
    (selectedNodeIds.size > 0 &&
      !!graphEdge &&
      selectedNodeIds.has(graphEdge.sourceNodeId) &&
      selectedNodeIds.has(graphEdge.targetNodeId))

  const isDimmed = useMemo(
    () => isEdgeDimmed(graphEdge, id, selectedNodeIds, selectedEdgeIds),
    [id, graphEdge, selectedNodeIds, selectedEdgeIds]
  )

  // Show source slot label when source node has multiple outputs
  const sourceLabel = useMemo(() => {
    if (!graphEdge) return null
    const srcNode = nodes.find((n) => n.id === graphEdge.sourceNodeId)
    if (!srcNode) return null
    const outSlots = srcNode.slots.filter((s) => s.direction === 'out')
    if (outSlots.length <= 1) return null
    return graphEdge.sourceSlot
  }, [graphEdge, nodes])

  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })

  const strokeColor = isInvalid ? '#ef4444' : isSelected ? 'var(--accent-blue)' : '#9ca3af'

  return (
    <>
      <g opacity={isDimmed ? 0.15 : 1} style={{ transition: 'opacity 0.2s ease' }}>
        <path d={path} fill="none" stroke="transparent" strokeWidth={16} style={{ cursor: 'pointer' }} />
        {isSelected && (
          <path d={path} fill="none" stroke="var(--accent-blue)" strokeWidth={8} strokeLinecap="round" opacity={0.2} />
        )}
        {isInvalid && !isSelected && (
          <path d={path} fill="none" stroke="#ef4444" strokeWidth={8} strokeLinecap="round" opacity={0.15} />
        )}
        <BaseEdge
          id={id}
          path={path}
          labelX={labelX}
          labelY={labelY}
          style={{
            stroke: strokeColor,
            strokeWidth: EDGE_WIDTH,
            strokeLinecap: 'round',
            strokeDasharray: isInvalid ? '6,4' : undefined
          }}
        />
      </g>
      {sourceLabel && !isDimmed && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -120%) translate(${labelX}px, ${labelY}px)`,
              fontSize: '10px',
              color: 'var(--text-secondary)',
              background: 'rgba(255,255,255,0.85)',
              padding: '1px 4px',
              borderRadius: 3,
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            {sourceLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const MemoizedCanvasEdge = memo(CanvasEdgeComponent)
export { MemoizedCanvasEdge as CanvasEdge }
