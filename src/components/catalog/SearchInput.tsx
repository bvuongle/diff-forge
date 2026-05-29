import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material'

import { useUIStore } from '@state/uiStore'

type SearchInputProps = {
  placeholder?: string
}

function SearchInput({ placeholder = 'Search' }: SearchInputProps) {
  const searchQuery = useUIStore((s) => s.searchQuery)
  const setSearchQuery = useUIStore((s) => s.setSearchQuery)

  return (
    <TextField
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder={placeholder}
      size="small"
      variant="outlined"
      fullWidth
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
        endAdornment: searchQuery ? (
          <InputAdornment position="end">
            <Tooltip title="Clear search">
              <IconButton size="small" edge="end" aria-label="Clear search" onClick={() => setSearchQuery('')}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ) : undefined
      }}
    />
  )
}

export { SearchInput }
