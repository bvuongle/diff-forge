import React from 'react'
import { Paper, Box, Typography } from '@mui/material'

function CanvasPanel() {
  return (
    <Paper
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 0,
        backgroundColor: '#fafafa'
      }}
    >
      <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Canvas coming soon
        </Typography>
        <Typography variant="body2">
          Drag components here to compose your topology
        </Typography>
      </Box>
    </Paper>
  )
}

export { CanvasPanel }
