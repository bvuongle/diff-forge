import SearchIcon from '@mui/icons-material/Search'
import { InputAdornment, TextField } from '@mui/material'
import { useUIStore } from '@state/uiStore'

type SearchInputProps = {
  placeholder?: string
}

function SearchInput({ placeholder = 'Search components...' }: SearchInputProps) {
  const { searchQuery, setSearchQuery } = useUIStore()

  return (
    <TextField
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder={placeholder}
      size="small"
      fullWidth
      variant="outlined"
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
        )
      }}
    />
  )
}

export { SearchInput }
