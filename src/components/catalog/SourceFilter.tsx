import { FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from '@mui/material'

import { ALL_SOURCES } from '@domain/catalog/searchCatalog'
import { useUIStore } from '@state/uiStore'

type SourceFilterProps = {
  sources: string[]
}

function SourceFilter({ sources }: SourceFilterProps) {
  const sourceFilter = useUIStore((s) => s.sourceFilter)
  const setSourceFilter = useUIStore((s) => s.setSourceFilter)

  const onChange = (event: SelectChangeEvent<string>) => setSourceFilter(event.target.value)

  return (
    <FormControl size="small" fullWidth>
      <InputLabel id="source-filter-label">Source</InputLabel>
      <Select
        labelId="source-filter-label"
        value={sourceFilter}
        label="Source"
        onChange={onChange}
        sx={{ bgcolor: 'var(--input-background)' }}
      >
        <MenuItem value={ALL_SOURCES}>All sources</MenuItem>
        {sources.map((source) => (
          <MenuItem key={source} value={source}>
            {source}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export { SourceFilter }
