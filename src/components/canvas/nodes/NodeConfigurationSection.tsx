import { useState } from 'react'

import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

import { CatalogComponent } from '@domain/catalog/CatalogTypes'
import { GraphNode } from '@domain/graph/GraphTypes'

import { ConfigFieldRenderer } from './ConfigFieldRenderer'
import { JsonConfigEditor } from './JsonConfigEditor'

interface NodeConfigurationSectionProps {
  node: GraphNode
  catalogComponent: CatalogComponent
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void
}

export function NodeConfigurationSection({ node, catalogComponent, updateNodeConfig }: NodeConfigurationSectionProps) {
  const [configTab, setConfigTab] = useState<'fields' | 'json'>('fields')
  const configSchema = catalogComponent.configSchema
  const configEntries = Object.entries(configSchema)

  const handleConfigField = (name: string, value: unknown) => {
    updateNodeConfig(node.id, { ...node.config, [name]: value })
  }

  if (configEntries.length === 0) return null

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
          CONFIGURATION
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={configTab}
          onChange={(_, v) => {
            if (v) setConfigTab(v as 'fields' | 'json')
          }}
          sx={{ height: 22 }}
        >
          <ToggleButton value="fields" sx={{ fontSize: '0.65rem', px: 0.75, py: 0 }}>
            Fields
          </ToggleButton>
          <ToggleButton value="json" sx={{ fontSize: '0.65rem', px: 0.75, py: 0 }}>
            JSON
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ maxHeight: 180, overflowY: 'auto', position: 'relative', zIndex: 2 }}>
        {configTab === 'fields' ? (
          <Box display="flex" flexDirection="column" gap={1.5} marginTop={1}>
            {configEntries.map(([name, schema]) => (
              <ConfigFieldRenderer
                key={name}
                fieldName={name}
                schema={schema}
                value={node.config[name]}
                onChange={handleConfigField}
              />
            ))}
          </Box>
        ) : (
          <JsonConfigEditor config={node.config} onSave={(cfg) => updateNodeConfig(node.id, cfg)} />
        )}
      </Box>
    </Box>
  )
}
