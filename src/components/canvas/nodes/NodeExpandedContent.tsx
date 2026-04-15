import { Box, Chip, Divider } from '@mui/material'

import { CatalogComponent } from '@domain/catalog/CatalogTypes'
import { GraphNode } from '@domain/graph/GraphTypes'
import { useGraphStore } from '@state/graphStore'

import { NodeConfigurationSection } from './sections/NodeConfigurationSection'
import { NodeInfoSection } from './sections/NodeInfoSection'
import { NodeRequirementsSection } from './sections/NodeRequirementsSection'

type NodeExpandedContentProps = {
  node: GraphNode
  catalogComponent: CatalogComponent
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, slotName: string, portEl: HTMLElement) => void
}

function NodeExpandedContent({ node, catalogComponent, onPortMouseDown }: NodeExpandedContentProps) {
  const { graph, renameNode, updateNodeConfig } = useGraphStore()
  const implements_ = catalogComponent.implements

  return (
    <Box data-no-drag="true" sx={{ px: 1.5, py: 1.5, cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
      <NodeInfoSection node={node} graphNodes={graph.nodes} renameNode={renameNode} />

      {implements_.length > 0 && (
        <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
          {implements_.map((iface) => (
            <Chip key={iface} label={iface} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
          ))}
        </Box>
      )}

      <Divider sx={{ my: 1.5 }} />
      <NodeRequirementsSection node={node} onPortMouseDown={onPortMouseDown} />

      <Divider sx={{ my: 1.5 }} />
      <NodeConfigurationSection node={node} catalogComponent={catalogComponent} updateNodeConfig={updateNodeConfig} />
    </Box>
  )
}

export { NodeExpandedContent }
