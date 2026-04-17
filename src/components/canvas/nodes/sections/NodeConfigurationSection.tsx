import { useState } from 'react'

import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

import { CatalogComponent } from '@domain/catalog/CatalogTypes'
import { GraphNode } from '@domain/graph/GraphTypes'

import { ConfigFieldRenderer } from '../config/ConfigFieldRenderer'
import { JsonConfigEditor } from '../config/JsonConfigEditor'

type NodeConfigurationSectionProps = {
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
        <Typography variant="caption" color="text.secondary" fontWeight={600} className="section-heading">
          CONFIGURATION
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={configTab}
          onChange={(_, v) => {
            if (v) setConfigTab(v as 'fields' | 'json')
          }}
          className="config-toggle"
        >
          <ToggleButton value="fields" className="config-toggle-btn">
            Fields
          </ToggleButton>
          <ToggleButton value="json" className="config-toggle-btn">
            JSON
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box className="config-scroll">
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
