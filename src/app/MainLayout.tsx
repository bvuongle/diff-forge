import { Box, Divider } from '@mui/material'

import { CanvasPanel } from '@canvas/CanvasPanel'

import { LeftCatalogPanel } from './LeftCatalogPanel'
import { Topbar } from './Topbar'

function MainLayout() {
  return (
    <Box display="flex" flexDirection="column" height="100vh" bgcolor="var(--app-bg)">
      <Topbar />
      <Divider />
      <Box flex={1} display="grid" gridTemplateColumns="260px 1fr" minHeight={0}>
        <LeftCatalogPanel />
        <CanvasPanel />
      </Box>
    </Box>
  )
}

export { MainLayout }
