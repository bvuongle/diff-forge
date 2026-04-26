import { useState } from 'react'

import { Box, TextField, Typography } from '@mui/material'

import { GraphNode } from '@core/graph/GraphTypes'

type NodeInfoSectionProps = {
  node: GraphNode
  graphNodes: GraphNode[]
  renameNode: (oldId: string, newId: string) => void
}

export function NodeInfoSection({ node, graphNodes, renameNode }: NodeInfoSectionProps) {
  const [editId, setEditId] = useState(node.instanceId)
  const [idError, setIdError] = useState('')

  const commitRename = () => {
    const trimmed = editId.trim()
    if (!trimmed) {
      setIdError('Cannot be empty')
      return
    }
    if (trimmed !== node.id && graphNodes.some((n) => n.id === trimmed)) {
      setIdError('Already in use')
      return
    }
    setIdError('')
    if (trimmed !== node.id) renameNode(node.id, trimmed)
  }

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
        INFO
      </Typography>
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
            Source
          </Typography>
          <Typography variant="body2" fontSize="0.8rem">
            {node.source}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
