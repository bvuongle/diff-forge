import { ToggleButton, ToggleButtonGroup } from '@mui/material'

import type { SearchMode } from '@domain/catalog/searchCatalog'
import { useUIStore } from '@state/uiStore'

function SearchModeToggle() {
  const searchMode = useUIStore((s) => s.searchMode)
  const setSearchMode = useUIStore((s) => s.setSearchMode)

  const onChange = (_event: React.MouseEvent<HTMLElement>, next: SearchMode | null) => {
    if (next) setSearchMode(next)
  }

  return (
    <ToggleButtonGroup value={searchMode} exclusive onChange={onChange} size="small" fullWidth aria-label="Search mode">
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
