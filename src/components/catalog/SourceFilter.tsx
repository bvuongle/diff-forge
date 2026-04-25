import { useState } from 'react'

import FilterAltIcon from '@mui/icons-material/FilterAlt'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography
} from '@mui/material'

import { useUIStore } from '@state/uiStore'

import { sourceLabel } from './sourceLabel'

type SourceFilterProps = {
  sources: string[]
}

function SourceFilter({ sources }: SourceFilterProps) {
  const sourceFilters = useUIStore((s) => s.sourceFilters)
  const toggle = useUIStore((s) => s.toggleSourceFilter)
  const clear = useUIStore((s) => s.clearSourceFilters)

  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = Boolean(anchor)
  const activeCount = sourceFilters.size

  if (sources.length === 0) return null

  return (
    <>
      <Tooltip title="Filter by source">
        <IconButton
          size="small"
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label="Filter by source"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Badge badgeContent={activeCount} color="primary" overlap="circular">
            {activeCount > 0 ? <FilterAltIcon fontSize="small" /> : <FilterAltOutlinedIcon fontSize="small" />}
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 240 } } }}
      >
        <Box px={2} py={1} display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            Sources
          </Typography>
          <Button size="small" onClick={clear} disabled={activeCount === 0}>
            Clear
          </Button>
        </Box>
        <Divider />
        {sources.map((source) => {
          const checked = sourceFilters.has(source)
          return (
            <MenuItem key={source} onClick={() => toggle(source)} dense>
              <Checkbox edge="start" size="small" checked={checked} disableRipple sx={{ py: 0 }} />
              <ListItemText primary={sourceLabel(source)} secondary={source} />
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}

export { SourceFilter }
