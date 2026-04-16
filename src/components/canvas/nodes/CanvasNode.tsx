import { memo, useCallback, useMemo } from 'react'

import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Chip, Divider, IconButton, Typography } from '@mui/material'
import { useConnection, type NodeProps } from '@xyflow/react'

import { useCatalogStore } from '@state/catalogStore'
import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'
import { NODE_WIDTH_COMPACT, NODE_WIDTH_EXPANDED } from '@canvas/canvasConstants'
import type { CanvasNode } from '@canvas/canvasTypes'

import { isNodeDimmed } from '../selection/selectionDimming'
import { getConnectionCounts } from './ports/getConnectedSlots'
import { getEdgeSourceMap } from './ports/slotUtils'
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
      catalog?.components.find((c) => c.type === graphNode.componentType && c.version === graphNode.version) ?? null,
    [catalog, graphNode.componentType, graphNode.version]
  )

  const connectionCounts = useMemo(() => getConnectionCounts(id, edges), [id, edges])
  const edgeSourceMap = useMemo(() => getEdgeSourceMap(id, { nodes: graphNodes, edges }), [id, graphNodes, edges])

  const isDimmed = useMemo(
    () => isNodeDimmed(id, selectedNodeIds, selectedEdgeIds, edges),
    [id, selectedNodeIds, selectedEdgeIds, edges]
  )

  const inputSlots = useMemo(() => graphNode.slots.filter((s) => s.direction === 'in'), [graphNode.slots])
  const outputSlots = useMemo(() => graphNode.slots.filter((s) => s.direction === 'out'), [graphNode.slots])
  const minWidth = isExpanded ? NODE_WIDTH_EXPANDED : NODE_WIDTH_COMPACT

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

  return (
    <Box
      sx={{
        minWidth,
        width: 'fit-content',
        bgcolor: 'var(--panel-bg)',
        borderRadius: 2,
        border: '2px solid',
        borderColor: selected ? 'var(--accent-blue)' : 'var(--panel-border)',
        boxShadow: selected ? '0 0 0 3px var(--accent-blue-light)' : '0 1px 4px rgba(0,0,0,0.08)',
        userSelect: 'none',
        transition: 'opacity 0.2s ease',
        opacity: isDimmed ? 0.3 : 1,
        '&:hover': { borderColor: selected ? 'var(--accent-blue)' : '#bbb' }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }} noWrap>
              {graphNode.componentType}
            </Typography>
            <Chip
              label={graphNode.version}
              size="small"
              sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#e8eaed', '& .MuiChip-label': { px: 0.75 } }}
            />
          </Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.3, mt: 0.25 }} noWrap>
            {graphNode.instanceId}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleToggle} sx={{ mt: -0.25, mr: -0.5 }}>
          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Expanded content */}
      {isExpanded && catalogComponent && (
        <Box
          className="nodrag nowheel nopan"
          sx={{ px: 1.5, py: 1.5, cursor: 'default' }}
          onClick={(e) => e.stopPropagation()}
        >
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

          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
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
      )}

      {/* Compact port rows */}
      {!isExpanded && (
        <Box sx={{ px: 1.5, py: 1 }}>
          <NodeRequirementsSection
            nodeId={id}
            inputSlots={inputSlots}
            outputSlots={outputSlots}
            connectionCounts={connectionCounts}
            edgeSourceMap={edgeSourceMap}
            dragInfo={dragInfo}
          />
        </Box>
      )}
    </Box>
  )
}

const MemoizedCanvasNode = memo(CanvasNodeComponent)
export { MemoizedCanvasNode as CanvasNode }
