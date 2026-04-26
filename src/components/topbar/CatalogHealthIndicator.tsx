import { useState } from 'react'

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Badge, Box, IconButton, Popover, Stack, Tooltip, Typography } from '@mui/material'

import type { RepoLoadOutcome } from '@contracts/CatalogSource'
import { useCatalogStore, type CatalogStatus } from '@state/catalogStore'

function CatalogHealthIndicator() {
  const status = useCatalogStore((s) => s.status)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const issues = problemRepos(status)
  if (issues.length === 0) return null

  const failed = issues.filter((r) => r.status === 'failed')
  const stale = issues.filter((r) => r.status === 'stale')
  const severity: 'error' | 'warning' = failed.length > 0 ? 'error' : 'warning'
  const Icon = severity === 'error' ? ErrorOutlineIcon : WarningAmberIcon

  const onOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
  const onClose = () => setAnchorEl(null)
  const tooltip = buildTooltip(failed.length, stale.length)

  return (
    <>
      <Tooltip title={tooltip}>
        <IconButton size="small" onClick={onOpen} aria-label="Catalog issues">
          <Badge badgeContent={issues.length} color={severity}>
            <Icon fontSize="small" color={severity} />
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
          {failed.length > 0 && <RepoGroup title="Failed to fetch (no cache)" repos={failed} />}
          {stale.length > 0 && (
            <Box sx={{ mt: failed.length > 0 ? 2 : 0 }}>
              <RepoGroup title="Using cached data" repos={stale} />
            </Box>
          )}
        </Box>
      </Popover>
    </>
  )
}

function buildTooltip(failed: number, stale: number): string {
  const parts: string[] = []
  if (failed > 0) parts.push(`${failed} ${failed === 1 ? 'repository' : 'repositories'} failed to fetch`)
  if (stale > 0) parts.push(`${stale} using cached data`)
  return parts.join(', ')
}

function RepoGroup({ title, repos }: { title: string; repos: RepoLoadOutcome[] }) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      <Stack spacing={1}>
        {repos.map((repo) => (
          <Box key={repo.url}>
            <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>
              {repo.url}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
              {repo.status === 'failed' || repo.status === 'stale' ? repo.reason : ''}
            </Typography>
          </Box>
        ))}
      </Stack>
    </>
  )
}

function problemRepos(status: CatalogStatus): RepoLoadOutcome[] {
  if (status.status !== 'ready' && status.status !== 'partial' && status.status !== 'error') return []
  return status.repos.filter((r) => r.status === 'failed' || r.status === 'stale')
}

export { CatalogHealthIndicator }
