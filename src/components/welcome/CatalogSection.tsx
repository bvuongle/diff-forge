import { useState } from 'react'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Alert, Box, Button, Chip, CircularProgress, Stack, Tooltip, Typography } from '@mui/material'

import type { RepoSummary } from '@core/catalog/CatalogStatus'
import { useCatalogStore } from '@state/catalogStore'
import { notify } from '@state/notificationsStore'
import { refreshCatalog } from '@adapters/catalogLoader'

type FailedRepo = { url: string; reason: string }

function CatalogSection() {
  const status = useCatalogStore((s) => s.status)
  const setStatus = useCatalogStore((s) => s.setStatus)
  const [busy, setBusy] = useState(false)

  const onRefresh = async () => {
    setBusy(true)
    try {
      const result = await refreshCatalog()
      if (result.status === 'unavailable') {
        notify.error('Electron bridge unavailable - run `pnpm dev` from the diff-forge folder.')
        return
      }
      if (result.status === 'unconfigured') {
        setStatus({ status: 'unconfigured' })
        notify.warning('DF_ARTIFACTORY_REPOS is not set. Export it and relaunch diff-forge.')
        return
      }
      setStatus(result)
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
          <FailedReposList repos={collectFailures(status.repos)} />
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
          Configure catalog repositories
        </Typography>
        <Typography variant="body2" gutterBottom>
          Set <code>DF_ARTIFACTORY_REPOS</code> in your shell (comma-separated URLs) and relaunch diff-forge.
        </Typography>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 1,
            bgcolor: 'action.hover',
            borderRadius: 1,
            fontSize: '0.75rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}
        >
          {`export DF_ARTIFACTORY_REPOS="https://repo.example/artifactory/conan-repo"
export DF_ARTIFACTORY_TOKEN="<optional-bearer-token>"
diff_forge .`}
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
        <FailedReposList repos={collectFailures(status.repos)} />
        <Box>
          <RefreshButton busy={busy} repoCount={status.repos.length} onClick={onRefresh} ariaLabel="Refresh catalog" />
        </Box>
      </Stack>
    </Alert>
  )
}

function collectFailures(repos: RepoSummary[]): FailedRepo[] {
  return repos
    .filter((r) => r.state.status === 'failed')
    .map((r) => ({ url: r.url, reason: r.state.status === 'failed' ? r.state.reason : '' }))
}

function FailedReposList({ repos }: { repos: FailedRepo[] }) {
  if (repos.length === 0) return null
  return (
    <Box component="ul" sx={{ m: 0, pl: 3 }}>
      {repos.map((repo) => (
        <Box component="li" key={repo.url} sx={{ mb: 0.5 }}>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            {repo.url}
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

function RepoStatusList({ repos }: { repos: RepoSummary[] }) {
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

function RepoChip({ repo }: { repo: RepoSummary }) {
  const isOk = repo.state.status === 'ok'
  const label = repoLabel(repo.url)
  const tooltipTitle = repo.state.status === 'failed' ? `${repo.url}\n${repo.state.reason}` : repo.url
  return (
    <Tooltip title={tooltipTitle} placement="top">
      <Chip
        size="small"
        icon={isOk ? <CheckCircleOutlineIcon fontSize="small" /> : <ErrorOutlineIcon fontSize="small" />}
        color={isOk ? 'success' : 'error'}
        variant="outlined"
        label={label}
      />
    </Tooltip>
  )
}

export { CatalogSection }
