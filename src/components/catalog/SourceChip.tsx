import { type MouseEvent } from 'react'

import { Chip, Tooltip } from '@mui/material'

import { notify } from '@state/notificationsStore'

type SourceChipProps = {
  url: string
  copyable?: boolean
}

function sourceLabel(url: string): string {
  const trimmed = url.replace(/\/+$/, '')
  const last = trimmed.split('/').pop()
  return last && last.length > 0 ? last : trimmed
}

function SourceChip({ url, copyable = false }: SourceChipProps) {
  const onClick = copyable
    ? (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
        void copySource(url)
      }
    : undefined

  return (
    <Tooltip
      title={copyable ? `${url}\nClick to copy` : url}
      placement="top"
      slotProps={{ tooltip: { sx: { whiteSpace: 'pre-line' } } }}
    >
      <Chip
        size="small"
        variant="outlined"
        className="diff-source-chip"
        label={sourceLabel(url)}
        onClick={onClick}
        sx={{ cursor: copyable ? 'pointer' : 'default' }}
      />
    </Tooltip>
  )
}

async function copySource(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    notify.success('Source URL copied')
  } catch {
    notify.error('Copy failed')
  }
}

export { SourceChip }
