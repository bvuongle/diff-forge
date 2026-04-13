import { useRef, useState } from 'react'

import { Box, Chip, Divider, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

import { CatalogComponent } from '@domain/catalog/CatalogTypes'
import { GraphNode, Slot } from '@domain/graph/GraphTypes'
import { useGraphStore } from '@state/graphStore'

import { ConfigFieldRenderer } from './ConfigFieldRenderer'
import { JsonConfigEditor } from './JsonConfigEditor'
import { PortRow, type DragInfo } from './PortRow'
import { getSlotTooltip, type EdgeSourceMap } from './slotUtils'

type NodeExpandedContentProps = {
  node: GraphNode
  catalogComponent: CatalogComponent
  connectedSlots: Set<string>
  dragInfo: DragInfo | null
  edgeSourceMap: EdgeSourceMap
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, slotName: string, portEl: HTMLElement) => void
  onVersionChange: (nodeId: string, version: string) => void
}

function OutputPortRow({
  nodeId,
  outputSlots,
  connectedSlots,
  onPortMouseDown
}: {
  nodeId: string
  outputSlots: Slot[]
  connectedSlots: Set<string>
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, slotName: string, portEl: HTMLElement) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isConnected = outputSlots.some((s) => connectedSlots.has(s.name))
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, py: 0.5, height: 32 }}>
      {outputSlots.length === 1 && (
        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
          {outputSlots[0].interface}
        </Typography>
      )}
      <Box
        ref={ref}
        data-port-handle="true"
        data-node-id={nodeId}
        data-slot-name="__out__"
        data-direction="out"
        onMouseDown={(e) => {
          if (ref.current) onPortMouseDown(e, nodeId, '__out__', ref.current)
        }}
        sx={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '2px solid',
          borderColor: isConnected ? '#22c55e' : 'var(--panel-border)',
          bgcolor: isConnected ? '#22c55e' : '#fff',
          cursor: 'crosshair',
          flexShrink: 0,
          transition: 'all 0.15s ease',
          '&:hover': { borderColor: 'var(--accent-blue)', bgcolor: 'var(--accent-blue-light)', transform: 'scale(1.2)' }
        }}
      />
    </Box>
  )
}

function NodeExpandedContent({
  node,
  catalogComponent,
  connectedSlots,
  dragInfo,
  edgeSourceMap,
  onPortMouseDown,
  onVersionChange
}: NodeExpandedContentProps) {
  const { graph, renameNode, updateNodeConfig } = useGraphStore()
  const [editId, setEditId] = useState(node.instanceId)
  const [idError, setIdError] = useState('')
  const [configTab, setConfigTab] = useState<'fields' | 'json'>('fields')

  const currentVersion = catalogComponent.versions[node.version]
  const configSchema = currentVersion?.configSchema ?? {}
  const implements_ = currentVersion?.implements ?? []
  const configEntries = Object.entries(configSchema)
  const versionKeys = Object.keys(catalogComponent.versions)

  const inputSlots = node.slots.filter((s) => s.direction === 'in')
  const outputSlots = node.slots.filter((s) => s.direction === 'out')

  const commitRename = () => {
    const trimmed = editId.trim()
    if (!trimmed) {
      setIdError('Cannot be empty')
      return
    }
    if (trimmed !== node.id && graph.nodes.some((n) => n.id === trimmed)) {
      setIdError('Already in use')
      return
    }
    setIdError('')
    if (trimmed !== node.id) renameNode(node.id, trimmed)
  }

  const handleConfigField = (name: string, value: unknown) => {
    updateNodeConfig(node.id, { ...node.config, [name]: value })
  }

  return (
    <Box data-no-drag="true" sx={{ px: 1.5, py: 1.5, cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
      {/* INFO */}
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
        INFO
      </Typography>
      <Box display="flex" flexDirection="column" gap={1.5} mt={1}>
        <TextField
          label="Instance ID"
          size="small"
          fullWidth
          value={editId}
          onChange={(e) => {
            setEditId(e.target.value)
            setIdError('')
          }}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
          }}
          error={Boolean(idError)}
          helperText={idError || undefined}
        />
        <Box display="flex" gap={2}>
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary">
              Type
            </Typography>
            <Typography variant="body2" fontSize="0.8rem">
              {node.componentType}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary">
              Module
            </Typography>
            <Typography variant="body2" fontSize="0.8rem">
              {node.module}
            </Typography>
          </Box>
        </Box>
        <TextField
          label="Version"
          size="small"
          fullWidth
          select
          value={node.version}
          onChange={(e) => onVersionChange(node.id, e.target.value)}
        >
          {versionKeys.map((v) => (
            <MenuItem key={v} value={v}>
              {v}
            </MenuItem>
          ))}
        </TextField>
        {implements_.length > 0 && (
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {implements_.map((iface) => (
              <Chip key={iface} label={iface} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
            ))}
          </Box>
        )}
      </Box>

      {/* REQUIREMENTS (with port circles) */}
      <Divider sx={{ my: 1.5 }} />
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
        REQUIREMENTS
      </Typography>
      <Box mt={0.5}>
        {inputSlots.map((slot) => (
          <PortRow
            key={slot.name}
            slot={slot}
            nodeId={node.id}
            side="left"
            isConnected={connectedSlots.has(slot.name)}
            dragInfo={dragInfo}
            tooltipText={getSlotTooltip(edgeSourceMap, slot.name)}
            onMouseDown={onPortMouseDown}
          />
        ))}
        {outputSlots.length > 0 && (
          <OutputPortRow
            nodeId={node.id}
            outputSlots={outputSlots}
            connectedSlots={connectedSlots}
            onPortMouseDown={onPortMouseDown}
          />
        )}
      </Box>

      {/* CONFIGURATION */}
      {configEntries.length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
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
        </>
      )}
    </Box>
  )
}

export { NodeExpandedContent }
