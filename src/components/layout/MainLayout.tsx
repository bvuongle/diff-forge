import { Box, Divider } from '@mui/material'

import { Topbar } from '@topbar/Topbar'
import { CatalogPanel } from '@catalog/CatalogPanel'
import { CanvasPanel } from '@canvas/CanvasPanel'

function MainLayout() {
  return (
    <Box display="flex" flexDirection="column" height="100vh" bgcolor="var(--app-bg)">
      <Topbar />
      <Divider />
      <Box flex={1} display="grid" gridTemplateColumns="auto 1fr" minHeight={0}>
        <CatalogPanel />
        <CanvasPanel />
      </Box>
    </Box>
  )
}

export { MainLayout }
