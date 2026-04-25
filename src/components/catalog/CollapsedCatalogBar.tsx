import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, IconButton, Tooltip } from '@mui/material'

import { useUIStore } from '@state/uiStore'

import { CATALOG_COLLAPSED_BAR_WIDTH_PX } from './catalogConstants'

function CollapsedCatalogBar() {
  const toggle = useUIStore((s) => s.toggleCatalogPanelCollapsed)
  return (
    <Box
      width={CATALOG_COLLAPSED_BAR_WIDTH_PX}
      display="flex"
      flexDirection="column"
      alignItems="center"
      pt={1}
      borderRight={1}
      borderColor="var(--panel-border)"
      bgcolor="var(--panel-bg)"
    >
      <Tooltip title="Show catalog" placement="right">
        <IconButton size="small" onClick={toggle} aria-label="Show catalog">
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  )
}

export { CollapsedCatalogBar }
