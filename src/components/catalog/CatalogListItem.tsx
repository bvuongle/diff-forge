import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined'
import { Box, Chip, ListItemButton, Stack, Typography } from '@mui/material'

import type { CatalogComponent } from '@core/catalog/CatalogSchema'

import { SourceChip } from './SourceChip'

type CatalogListItemProps = {
  component: CatalogComponent
}

function setRoundedDragImage(event: React.DragEvent) {
  const OFFSCREEN_TOP_PX = -9999
  const DRAG_IMAGE_BORDER_RADIUS_PX = 8
  const DRAG_IMAGE_ANCHOR_Y_PX = 20

  const el = event.currentTarget as HTMLElement
  const clone = el.cloneNode(true) as HTMLElement
  Object.assign(clone.style, {
    position: 'absolute',
    top: `${OFFSCREEN_TOP_PX}px`,
    borderRadius: `${DRAG_IMAGE_BORDER_RADIUS_PX}px`,
    overflow: 'hidden',
    width: `${el.offsetWidth}px`
  })
  document.body.appendChild(clone)
  event.dataTransfer.setDragImage(clone, el.offsetWidth / 2, DRAG_IMAGE_ANCHOR_Y_PX)
  requestAnimationFrame(() => document.body.removeChild(clone))
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
      <Stack direction="row" spacing={1.5} alignItems="center" width="100%">
        <WidgetsOutlinedIcon fontSize="small" sx={{ color: 'var(--text-secondary)' }} />
        <Box flex={1} minWidth={0}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {component.type}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={`v${component.version}`}
              sx={{ bgcolor: 'var(--input-background)', height: 22 }}
            />
            <SourceChip url={component.source} />
          </Stack>
        </Box>
      </Stack>
    </ListItemButton>
  )
}

export { CatalogListItem }
