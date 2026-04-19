import { memo, useCallback, useMemo } from 'react'

import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Box, Chip, Collapse, Divider, IconButton, Tooltip, Typography } from '@mui/material'
import { useConnection, type NodeProps } from '@xyflow/react'

import { useCatalogStore } from '@state/catalogStore'
import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'
import { NODE_MIN_WIDTH_COMPACT, NODE_MIN_WIDTH_EXPANDED } from '@canvas/canvasConstants'
import type { CanvasNode } from '@canvas/canvasTypes'

import { getConnectionCounts, getEdgeSourceMap, isNodeDimmed } from './nodeUtils'
import { NodeConfigurationSection } from './sections/NodeConfigurationSection'
import { NodeInfoSection } from './sections/NodeInfoSection'
import { NodeRequirementsSection } from './sections/NodeRequirementsSection'

function CanvasNodeComponent({ data, selected, id }: NodeProps<CanvasNode>) {
  const { graphNode } = data

  const isExpanded = useUIStore((s) => s.expandedNodeIds.has(id))
  const toggleNodeExpanded = useUIStore((s) => s.toggleNodeExpanded)

  const edges = useGraphStore((s) => s.graph.edges)
  const graphNodes = useGraphStore((s) => s.graph.nodes)
  const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds)
  const selectedEdgeIds = useGraphStore((s) => s.selectedEdgeIds)
  const renameNode = useGraphStore((s) => s.renameNode)
  const updateNodeConfig = useGraphStore((s) => s.updateNodeConfig)
  const catalog = useCatalogStore((s) => s.catalog)
  const connection = useConnection()

  const catalogComponent = useMemo(
    () =>
      catalog?.components.find(
        (c) => c.type === graphNode.componentType && c.version === graphNode.version && c.source === graphNode.source
      ) ?? null,
    [catalog, graphNode.componentType, graphNode.version, graphNode.source]
  )

  const isUnresolved = catalog !== null && catalogComponent === null

  const connectionCounts = useMemo(() => getConnectionCounts(id, edges), [id, edges])
  const edgeSourceMap = useMemo(() => getEdgeSourceMap(id, { nodes: graphNodes, edges }), [id, graphNodes, edges])

  const isDimmed = useMemo(
    () => isNodeDimmed(id, selectedNodeIds, selectedEdgeIds, edges),
    [id, selectedNodeIds, selectedEdgeIds, edges]
  )

  const inputSlots = useMemo(() => graphNode.slots.filter((s) => s.direction === 'in'), [graphNode.slots])
  const outputSlots = useMemo(() => graphNode.slots.filter((s) => s.direction === 'out'), [graphNode.slots])
  const minWidth = isExpanded ? NODE_MIN_WIDTH_EXPANDED : NODE_MIN_WIDTH_COMPACT

  const dragInfo = useMemo(() => {
    if (!connection.inProgress) return null
    const srcNode = connection.fromNode
    if (!srcNode) return null
    const nodeData = srcNode.data as CanvasNode['data']
    const outInterfaces = nodeData.graphNode.slots
      .filter((s: { direction: string }) => s.direction === 'out')
      .map((s: { interface: string }) => s.interface)
    return { sourceNodeId: srcNode.id, sourceInterfaces: outInterfaces }
  }, [connection.inProgress, connection.fromNode])

  const handleToggle = useCallback(() => toggleNodeExpanded(id), [id, toggleNodeExpanded])

  const containerClass = [
    'canvas-node',
    selected && 'canvas-node--selected',
    isDimmed && 'canvas-node--dimmed',
    isUnresolved && 'canvas-node--unresolved'
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Box className={containerClass} sx={{ minWidth }}>
      {/* Header */}
      <Box className="canvas-node__header">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            {isUnresolved && (
              <Tooltip
                title={`No catalog entry for ${graphNode.componentType}@${graphNode.version} (${graphNode.source || 'unknown source'})`}
              >
                <WarningAmberIcon
                  fontSize="small"
                  aria-label="Unresolved component"
                  sx={{ color: 'var(--accent-amber, #f59e0b)', fontSize: '1rem' }}
                />
              </Tooltip>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }} noWrap>
              {graphNode.componentType}
            </Typography>
            <Chip label={graphNode.version} size="small" className="canvas-node__version-chip" />
          </Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.3, mt: 0.25 }} noWrap>
            {graphNode.instanceId}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleToggle} sx={{ mt: -0.25, mr: -0.5 }}>
          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={isExpanded && !!catalogComponent} timeout={220} mountOnEnter unmountOnExit>
        {catalogComponent ? (
          <Box className="canvas-node__expanded nodrag nowheel nopan" onClick={(e) => e.stopPropagation()}>
            <NodeInfoSection node={graphNode} graphNodes={graphNodes} renameNode={renameNode} />

            {catalogComponent.implements.length > 0 && (
              <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
                {catalogComponent.implements.map((iface) => (
                  <Chip
                    key={iface}
                    label={iface}
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            )}

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="caption" color="text.secondary" fontWeight={600} className="section-heading">
              REQUIREMENTS
            </Typography>
            <Box mt={0.5}>
              <NodeRequirementsSection
                nodeId={id}
                inputSlots={inputSlots}
                outputSlots={outputSlots}
                connectionCounts={connectionCounts}
                edgeSourceMap={edgeSourceMap}
                dragInfo={dragInfo}
              />
            </Box>

            <Divider sx={{ my: 1.5 }} />
            <NodeConfigurationSection
              node={graphNode}
              catalogComponent={catalogComponent}
              updateNodeConfig={updateNodeConfig}
            />
          </Box>
        ) : null}
      </Collapse>

      <Collapse in={!isExpanded} timeout={220} mountOnEnter unmountOnExit>
        <Box className="canvas-node__compact">
          <NodeRequirementsSection
            nodeId={id}
            inputSlots={inputSlots}
            outputSlots={outputSlots}
            connectionCounts={connectionCounts}
            edgeSourceMap={edgeSourceMap}
            dragInfo={dragInfo}
          />
        </Box>
      </Collapse>
    </Box>
  )
}

const MemoizedCanvasNode = memo(CanvasNodeComponent)
export { MemoizedCanvasNode as CanvasNode }
