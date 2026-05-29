import { ToggleButton, ToggleButtonGroup } from '@mui/material'

import type { SearchMode } from '@core/catalog/searchCatalog'
import { useUIStore } from '@state/uiStore'

function SearchModeToggle() {
  const searchMode = useUIStore((s) => s.searchMode)
  const setSearchMode = useUIStore((s) => s.setSearchMode)

  return (
    <ToggleButtonGroup
      value={searchMode}
      exclusive
      size="small"
      fullWidth
      aria-label="Search mode"
      onChange={(_, mode: SearchMode | null) => {
        if (mode) setSearchMode(mode)
      }}
      sx={{ mt: 1, '& .MuiToggleButton-root': { textTransform: 'none', py: 0.25, px: 1.25, fontSize: '0.75rem' } }}
    >
      <ToggleButton value="name" aria-label="Search by name">
        Name
      </ToggleButton>
      <ToggleButton value="interface" aria-label="Search by interface">
        Interface
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

export { SearchModeToggle }
