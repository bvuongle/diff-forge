import React from 'react'
import { TextField, InputAdornment } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useUIStore } from '@state/uiStore'

type SearchInputProps = {
  placeholder?: string
}

function SearchInput({ placeholder = 'Search components...' }: SearchInputProps) {
  const { searchQuery, setSearchQuery } = useUIStore()

  return (
    <TextField
      fullWidth
      size="small"
      placeholder={placeholder}
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        )
      }}
      sx={{
        backgroundColor: '#fafafa',
        borderRadius: 1,
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#fafafa'
        }
      }}
    />
  )
}

export { SearchInput }
