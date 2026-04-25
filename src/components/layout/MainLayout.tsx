import { Box, Divider } from '@mui/material'

import { useUIStore } from '@state/uiStore'
import { Topbar } from '@topbar/Topbar'
import { CatalogPanel } from '@catalog/CatalogPanel'
import { CollapsedCatalogBar } from '@catalog/CollapsedCatalogBar'
import { CanvasPanel } from '@canvas/CanvasPanel'

function MainLayout() {
  const collapsed = useUIStore((s) => s.catalogPanelCollapsed)
  return (
    <Box display="flex" flexDirection="column" height="100vh" bgcolor="var(--app-bg)">
      <Topbar />
      <Divider />
      <Box flex={1} display="grid" gridTemplateColumns="auto 1fr" minHeight={0}>
        {collapsed ? <CollapsedCatalogBar /> : <CatalogPanel />}
        <CanvasPanel />
      </Box>
    </Box>
  )
}

export { MainLayout }
