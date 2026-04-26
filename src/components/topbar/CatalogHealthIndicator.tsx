import { useState } from 'react'

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { Badge, Box, IconButton, Popover, Stack, Tooltip, Typography } from '@mui/material'

import type { CatalogStatus, RepoSummary } from '@core/catalog/CatalogStatus'
import { useCatalogStore } from '@state/catalogStore'

function CatalogHealthIndicator() {
  const status = useCatalogStore((s) => s.status)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const failed = failedRepos(status)
  if (failed.length === 0) return null

  const onOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
  const onClose = () => setAnchorEl(null)
  const tooltip = `${failed.length} ${failed.length === 1 ? 'repository' : 'repositories'} failed to fetch`

  return (
    <>
      <Tooltip title={tooltip}>
        <IconButton size="small" onClick={onOpen} aria-label="Catalog issues">
          <Badge badgeContent={failed.length} color="error">
            <ErrorOutlineIcon fontSize="small" color="error" />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, minWidth: 260, maxWidth: 420 }}>
          <Typography variant="subtitle2" gutterBottom>
            Repositories failed to fetch
          </Typography>
          <Stack spacing={1}>
            {failed.map((repo) => (
              <Box key={repo.url}>
                <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>
                  {repo.url}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                  {repo.state.status === 'failed' ? repo.state.reason : ''}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Popover>
    </>
  )
}

function failedRepos(status: CatalogStatus): RepoSummary[] {
  if (status.status !== 'ready' && status.status !== 'partial' && status.status !== 'error') return []
  return status.repos.filter((r) => r.state.status === 'failed')
}

export { CatalogHealthIndicator }
