import { useState } from 'react'

import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

import { CatalogComponent } from '@core/catalog/CatalogSchema'
import { GraphNode } from '@core/graph/GraphTypes'

import { FieldConfiguration } from '../configuration/FieldConfiguration'
import { JsonConfiguration } from '../configuration/JsonConfiguration'

type NodeConfigurationSectionProps = {
  node: GraphNode
  catalogComponent: CatalogComponent
  updateNodeConfig: (nodeId: string, configData: Record<string, unknown>) => void
}

export function NodeConfigurationSection({ node, catalogComponent, updateNodeConfig }: NodeConfigurationSectionProps) {
  const [configTab, setConfigTab] = useState<'fields' | 'json'>('fields')
  const configEntries = Object.entries(catalogComponent.config)

  const handleConfigField = (name: string, value: unknown) => {
    updateNodeConfig(node.id, { ...node.configData, [name]: value })
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
      <Box className="configuration-body">
        {configTab === 'fields' ? (
          <FieldConfiguration config={node.configData} schema={catalogComponent.config} onChange={handleConfigField} />
        ) : (
          <JsonConfiguration
            config={node.configData}
            schema={catalogComponent.config}
            onSave={(cfg) => updateNodeConfig(node.id, cfg)}
          />
        )}
      </Box>
    </Box>
  )
}
