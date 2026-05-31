import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined'
import { Box, Chip, ListItemButton, Stack, Tooltip, Typography } from '@mui/material'

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

function schemaTooltip(component: CatalogComponent) {
  const schema = {
    implements: component.implements,
    requires: component.requires,
    config: component.config
  }
  return (
    <Box component="pre" sx={{ m: 0, fontFamily: 'monospace', fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
      {JSON.stringify(schema, null, 2)}
    </Box>
  )
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
      <Stack direction="row" spacing={1} alignItems="flex-start" width="100%">
        <Tooltip
          title={schemaTooltip(component)}
          placement="right"
          enterDelay={400}
          slotProps={{ tooltip: { sx: { maxWidth: 360 } } }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" flex={1} minWidth={0}>
            <WidgetsOutlinedIcon fontSize="small" sx={{ color: 'var(--text-secondary)' }} />
            <Box flex={1} minWidth={0}>
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {component.type}
              </Typography>
              <Chip
                size="small"
                label={`v${component.version}`}
                sx={{ mt: 0.5, bgcolor: 'var(--input-background)', height: 22 }}
              />
            </Box>
          </Stack>
        </Tooltip>
        <SourceChip url={component.source} />
      </Stack>
    </ListItemButton>
  )
}

export { CatalogListItem }
