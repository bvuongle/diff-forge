import React from 'react'
import { Paper, Box, Typography, TextField, Button, Divider } from '@mui/material'
import { SectionHeader } from '../components/SectionHeader'
import { useGraphStore } from '@state/graphStore'

function RightInspectorPanel() {
  const { selectedNodeId, graph } = useGraphStore()
  const selectedNode = selectedNodeId
    ? graph.nodes.find((n) => n.id === selectedNodeId)
    : null

  return (
    <Paper
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 0
      }}
    >
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        {selectedNode ? (
          <>
            <SectionHeader title="Node Inspector" />
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Type
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {selectedNode.componentType}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Instance ID
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {selectedNode.instanceId}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <SectionHeader title="Configuration" />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Object.entries(selectedNode.config).map(([key, value]) => (
                <TextField
                  key={key}
                  label={key}
                  size="small"
                  value={value}
                  disabled
                  fullWidth
                />
              ))}
            </Box>
          </>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Select a node to inspect
          </Typography>
        )}
      </Box>

      <Divider />

      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
        <Button variant="outlined" fullWidth disabled={!selectedNodeId}>
          Delete
        </Button>
      </Box>
    </Paper>
  )
}

export { RightInspectorPanel }
