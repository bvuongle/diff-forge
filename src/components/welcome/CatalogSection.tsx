import { useState } from 'react'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import RefreshIcon from '@mui/icons-material/Refresh'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Alert, Box, Button, Chip, CircularProgress, Stack, Tooltip, Typography } from '@mui/material'

import type { RepoLoadOutcome } from '@contracts/CatalogSource'
import { useCatalogStore } from '@state/catalogStore'
import { notify } from '@state/notificationsStore'
import { ipcCatalogSource } from '@adapters/IpcCatalogSource'

type ProblemRepo = { url: string; reason: string; kind: 'stale' | 'failed' }

function CatalogSection() {
  const status = useCatalogStore((s) => s.status)
  const setStatus = useCatalogStore((s) => s.setStatus)
  const [busy, setBusy] = useState(false)

  const onRefresh = async () => {
    setBusy(true)
    try {
      const result = await ipcCatalogSource.loadCatalog()
      setStatus(result)
      if (result.status === 'unconfigured') {
        notify.warning(`Catalog source is unconfigured. Set: ${result.missing.join(', ')}`)
      }
    } finally {
      setBusy(false)
    }
  }

  if (status.status === 'ready') {
    return (
      <Stack spacing={1} alignItems="center" width="100%">
        <Stack direction="row" spacing={1} alignItems="center">
          <CheckCircleOutlineIcon color="success" />
          <Typography variant="body2">
            Catalog ready: {status.catalog.components.length} components across {status.repos.length}{' '}
            {status.repos.length === 1 ? 'repository' : 'repositories'}
          </Typography>
        </Stack>
        <RepoStatusList repos={status.repos} />
        <RefreshButton busy={busy} repoCount={status.repos.length} onClick={onRefresh} />
      </Stack>
    )
  }

  if (status.status === 'partial') {
    return (
      <Alert severity="warning" variant="outlined" sx={{ width: '100%', textAlign: 'left' }}>
        <Stack spacing={1}>
          <Typography variant="body2">
            {status.catalog.components.length} components loaded. {status.message}
          </Typography>
          <RepoStatusList repos={status.repos} />
          <ProblemReposList repos={collectProblems(status.repos)} />
          <Box>
            <RefreshButton busy={busy} repoCount={status.repos.length} onClick={onRefresh} />
          </Box>
        </Stack>
      </Alert>
    )
  }

  if (status.status === 'unconfigured') {
    return (
      <Alert severity="warning" variant="outlined" sx={{ width: '100%', textAlign: 'left' }}>
        <Typography variant="subtitle2" gutterBottom>
          Catalog source is unconfigured
        </Typography>
        <Typography variant="body2" gutterBottom>
          The following environment {status.missing.length === 1 ? 'variable is' : 'variables are'} missing. Set{' '}
          {status.missing.length === 1 ? 'it' : 'them'} in your shell and relaunch diff-forge.
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 3 }}>
          {status.missing.map((name) => (
            <Box component="li" key={name}>
              <code>{name}</code>
            </Box>
          ))}
        </Box>
      </Alert>
    )
  }

  if (status.status === 'loading') {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading catalog...
      </Typography>
    )
  }

  return (
    <Alert severity="error" variant="outlined" sx={{ width: '100%', textAlign: 'left' }}>
      <Stack spacing={1}>
        <Typography variant="body2">{status.message}</Typography>
        <ProblemReposList repos={collectProblems(status.repos)} />
        <Box>
          <RefreshButton busy={busy} repoCount={status.repos.length} onClick={onRefresh} ariaLabel="Refresh catalog" />
        </Box>
      </Stack>
    </Alert>
  )
}

function collectProblems(repos: RepoLoadOutcome[]): ProblemRepo[] {
  return repos
    .filter((r): r is RepoLoadOutcome & { status: 'stale' | 'failed' } => r.status !== 'ok')
    .map((r) => ({ url: r.url, reason: r.reason, kind: r.status }))
}

function ProblemReposList({ repos }: { repos: ProblemRepo[] }) {
  if (repos.length === 0) return null
  return (
    <Box component="ul" sx={{ m: 0, pl: 3 }}>
      {repos.map((repo) => (
        <Box component="li" key={repo.url} sx={{ mb: 0.5 }}>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            {repo.url} {repo.kind === 'stale' ? '(cached)' : ''}
          </Typography>
          {repo.reason && (
            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word', display: 'block' }}>
              {repo.reason}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  )
}

function RefreshButton({
  busy,
  repoCount,
  onClick,
  ariaLabel
}: {
  busy: boolean
  repoCount: number
  onClick: () => void
  ariaLabel?: string
}) {
  const label = busy
    ? repoCount > 0
      ? `Refreshing ${repoCount} ${repoCount === 1 ? 'repository' : 'repositories'}...`
      : 'Refreshing...'
    : 'Refresh'
  return (
    <Button
      size="small"
      startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
      onClick={onClick}
      disabled={busy}
      aria-label={ariaLabel}
    >
      {label}
    </Button>
  )
}

function RepoStatusList({ repos }: { repos: RepoLoadOutcome[] }) {
  if (repos.length === 0) return null
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {repos.map((repo) => (
        <RepoChip key={repo.url} repo={repo} />
      ))}
    </Stack>
  )
}

function repoLabel(url: string): string {
  const trimmed = url.replace(/\/+$/, '')
  const last = trimmed.split('/').pop()
  return last && last.length > 0 ? last : trimmed
}

function RepoChip({ repo }: { repo: RepoLoadOutcome }) {
  const label = repoLabel(repo.url)
  const tooltipTitle = repo.status === 'ok' ? repo.url : `${repo.url}\n${repo.reason}`
  const { color, icon } = chipPresentation(repo.status)
  return (
    <Tooltip title={tooltipTitle} placement="top">
      <Chip size="small" icon={icon} color={color} variant="outlined" label={label} />
    </Tooltip>
  )
}

function chipPresentation(repoStatus: RepoLoadOutcome['status']): {
  color: 'success' | 'warning' | 'error'
  icon: React.ReactElement
} {
  if (repoStatus === 'ok') return { color: 'success', icon: <CheckCircleOutlineIcon fontSize="small" /> }
  if (repoStatus === 'stale') return { color: 'warning', icon: <WarningAmberIcon fontSize="small" /> }
  return { color: 'error', icon: <ErrorOutlineIcon fontSize="small" /> }
}

export { CatalogSection }
