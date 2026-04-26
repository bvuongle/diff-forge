import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import SearchIcon from '@mui/icons-material/Search'
import TextFieldsIcon from '@mui/icons-material/TextFields'
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material'

import type { SearchMode } from '@core/catalog/searchCatalog'
import { useUIStore } from '@state/uiStore'

type SearchInputProps = {
  placeholder?: string
}

function SearchInput({ placeholder = 'Search components...' }: SearchInputProps) {
  const searchQuery = useUIStore((s) => s.searchQuery)
  const setSearchQuery = useUIStore((s) => s.setSearchQuery)
  const searchMode = useUIStore((s) => s.searchMode)
  const setSearchMode = useUIStore((s) => s.setSearchMode)

  const nextMode: SearchMode = searchMode === 'name' ? 'interface' : 'name'
  const tooltip =
    searchMode === 'name' ? 'Searching names. Switch to interface' : 'Searching interfaces. Switch to name'

  return (
    <TextField
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder={placeholder}
      size="small"
      variant="outlined"
      inputProps={{ size: placeholder.length }}
      sx={{
        '& .MuiOutlinedInput-root': {
          bgcolor: 'var(--input-background)'
        }
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <Tooltip title={tooltip}>
              <IconButton
                size="small"
                onClick={() => setSearchMode(nextMode)}
                aria-label={`Search mode: ${searchMode}`}
                aria-pressed={searchMode === 'interface'}
              >
                {searchMode === 'name' ? <TextFieldsIcon fontSize="small" /> : <HubOutlinedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </InputAdornment>
        )
      }}
    />
  )
}

export { SearchInput }
