import { memo, useMemo, type CSSProperties } from 'react'

import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'

import { isEdgeInvalid } from '@core/graph/graphOperations'
import { useGraphStore } from '@state/graphStore'
import type { CanvasEdge } from '@canvas/canvasTypes'

import { isEdgeDimmed } from './edgeUtils'

function edgeStroke(strokeColor: string, selected: boolean, isInvalid: boolean, style?: CSSProperties): CSSProperties {
  return {
    stroke: strokeColor,
    strokeWidth: selected ? 3 : 2,
    strokeLinecap: 'round',
    strokeDasharray: isInvalid ? '6,4' : undefined,
    ...style
  }
}

function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
  style
}: EdgeProps<CanvasEdge>) {
  const graphEdge = data?.graphEdge
  const nodes = useGraphStore((s) => s.graph.nodes)
  const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds)
  const selectedEdgeIds = useGraphStore((s) => s.selectedEdgeIds)

  const isInvalid = useMemo(() => (graphEdge ? isEdgeInvalid(graphEdge, nodes) : false), [graphEdge, nodes])

  const isDimmed = useMemo(
    () => isEdgeDimmed(graphEdge, id, selectedNodeIds, selectedEdgeIds),
    [id, graphEdge, selectedNodeIds, selectedEdgeIds]
  )

  const sourceLabel = useMemo(() => {
    if (!graphEdge) return null
    const srcNode = nodes.find((n) => n.id === graphEdge.sourceNodeId)
    if (!srcNode) return null
    const outSlots = srcNode.slots.filter((s) => s.direction === 'out')
    if (outSlots.length <= 1) return null
    return graphEdge.sourceSlot
  }, [graphEdge, nodes])

  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  const strokeColor = isInvalid ? 'var(--edge-invalid)' : selected ? 'var(--accent-blue)' : 'var(--edge-default)'

  return (
    <>
      <g className="canvas-edge" data-testid="edge-container" opacity={isDimmed ? 0.15 : 1}>
        <path d={path} fill="none" stroke="transparent" strokeWidth={16} className="canvas-edge__hit-area" />
        <BaseEdge
          id={id}
          path={path}
          labelX={labelX}
          labelY={labelY}
          markerEnd={markerEnd}
          style={edgeStroke(strokeColor, !!selected, isInvalid, style)}
        />
      </g>
      {sourceLabel && !isDimmed && (
        <EdgeLabelRenderer>
          <div
            className="canvas-edge__label"
            style={{ transform: `translate(-50%, -120%) translate(${labelX}px, ${labelY}px)` }}
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
