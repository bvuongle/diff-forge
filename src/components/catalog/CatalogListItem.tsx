import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined'
import { Box, Chip, ListItemButton, Stack, Typography } from '@mui/material'

import type { CatalogComponent } from '@domain/catalog/CatalogSchema'

import { setRoundedDragImage } from './setRoundedDragImage'

type CatalogListItemProps = {
  component: CatalogComponent
}

function CatalogListItem({ component }: CatalogListItemProps) {
  return (
    <ListItemButton
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('application/x-diff-component', JSON.stringify(component))
        event.dataTransfer.effectAllowed = 'copy'
        setRoundedDragImage(event)
      }}
      sx={{
        alignItems: 'flex-start',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'var(--panel-border)',
        bgcolor: 'var(--panel-bg)',
        cursor: 'grab',
        '&:hover': {
          bgcolor: 'var(--accent-blue-light)'
        }
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" width="100%">
        <WidgetsOutlinedIcon fontSize="small" sx={{ color: 'var(--text-secondary)' }} />
        <Box flex={1} minWidth={0}>
          <Typography variant="subtitle2" fontWeight={600}>
            {component.type}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {component.source}
          </Typography>
          <Box mt={1}>
            <Chip
              size="small"
              label={`v${component.version}`}
              sx={{ bgcolor: 'var(--input-background)', height: 22 }}
            />
          </Box>
        </Box>
      </Stack>
    </ListItemButton>
  )
}

export { CatalogListItem }
