import { type MouseEvent } from 'react'

import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined'
import { Box, Chip, ListItemButton, Stack, Tooltip, Typography } from '@mui/material'

import type { CatalogComponent } from '@domain/catalog/CatalogSchema'
import { notify } from '@state/notificationsStore'

import { setRoundedDragImage } from './setRoundedDragImage'
import { sourceLabel } from './sourceLabel'

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

function SourceChip({ url }: { url: string }) {
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (!event.metaKey && !event.ctrlKey) return
    void copyToClipboard(url)
  }
  return (
    <Tooltip title={`${url}\nCmd/Ctrl+Click to copy`} placement="top">
      <Chip
        size="small"
        variant="outlined"
        label={sourceLabel(url)}
        onClick={onClick}
        sx={{ height: 22, maxWidth: '100%', '& .MuiChip-label': { px: 1 } }}
      />
    </Tooltip>
  )
}

async function copyToClipboard(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    notify.success('Source URL copied')
  } catch {
    notify.error('Copy failed')
  }
}

export { CatalogListItem }
