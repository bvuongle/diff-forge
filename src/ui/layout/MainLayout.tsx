import React from 'react'
import { Box, Grid } from '@mui/material'
import { Topbar } from './Topbar'
import { LeftCatalogPanel } from './LeftCatalogPanel'
import { CanvasPanel } from './CanvasPanel'
import { RightInspectorPanel } from './RightInspectorPanel'

function MainLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar />

      <Grid
        container
        sx={{
          flex: 1,
          overflow: 'hidden',
          gap: 0,
          p: 1
        }}
      >
        <Grid size={{ xs: 12, sm: 3 }} sx={{ display: 'flex', minHeight: 0 }}>
          <LeftCatalogPanel />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', minHeight: 0 }}>
          <CanvasPanel />
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }} sx={{ display: 'flex', minHeight: 0 }}>
          <RightInspectorPanel />
        </Grid>
      </Grid>
    </Box>
  )
}

export { MainLayout }
