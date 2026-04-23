import { FormEvent, useEffect, useRef, useState } from 'react'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Alert, Box, Button, Chip, Divider, Stack, TextField, Typography } from '@mui/material'

import { reasonMessage } from '@domain/workspace/workspaceContext'
import { useCatalogStore } from '@state/catalogStore'
import { notify } from '@state/notificationsStore'
import { useWorkspaceStore } from '@state/workspaceStore'
import { refreshCatalog } from '@adapters/catalogLoader'
import { openWorkspaceAtPath, openWorkspacePicker, type OpenWorkspaceResult } from '@adapters/electronWorkspace'

function WelcomeScreen() {
  return (
    <Box className="diff-welcome">
      <Stack spacing={3} alignItems="center" className="diff-welcome__stack">
        <Box component="img" src="/logo.svg" alt="Diff Forge" className="diff-welcome__logo" />
        <Typography variant="h4" color="text.primary">
          Welcome to Diff Forge
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Diff Forge needs a component catalog and a project folder. Complete both steps to start composing topologies.
        </Typography>
        <CatalogSection />
        <Divider flexItem />
        <WorkspaceSection />
        <Typography variant="caption" color="text.secondary">
          Tip: once both are set, launch with <code>diff_forge .</code> from a project folder to skip this screen.
        </Typography>
      </Stack>
    </Box>
  )
}

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

  if (status.status === 'ready' || status.status === 'partial') {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CheckCircleOutlineIcon color="success" />
        <Typography variant="body2">
          Catalog ready: {status.catalog.components.length} components across {status.repos.length} repositor
          {status.repos.length === 1 ? 'y' : 'ies'}
        </Typography>
      </Stack>
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
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Typography variant="body2">{status.message}</Typography>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={busy}
          aria-label="Refresh catalog"
        >
          Refresh
        </Button>
      </Stack>
    </Alert>
  )
}

function WorkspaceSection() {
  const status = useWorkspaceStore((s) => s.status)
  const setStatus = useWorkspaceStore((s) => s.setStatus)
  const [busy, setBusy] = useState(false)
  const [pathInput, setPathInput] = useState('')
  const announcedReasonRef = useRef<string | null>(null)

  useEffect(() => {
    if (status && !status.valid) {
      const message = reasonMessage(status.reason)
      if (announcedReasonRef.current !== message) {
        notify.warning(message, 10000)
        announcedReasonRef.current = message
      }
    } else if (status?.valid) {
      announcedReasonRef.current = null
    }
  }, [status])

  if (status?.valid) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CheckCircleOutlineIcon color="success" />
        <Typography variant="body2" component="span">
          Workspace:
        </Typography>
        <Chip size="small" label={status.projectName} />
      </Stack>
    )
  }

  const applyResult = (result: OpenWorkspaceResult) => {
    if (result.status === 'opened') {
      setStatus(result.workspace)
    } else if (result.status === 'error') {
      notify.error(result.message)
    } else if (result.status === 'unavailable') {
      notify.error('Electron bridge unavailable - run `pnpm dev` from the diff-forge folder.')
    }
  }

  const onOpen = async () => {
    setBusy(true)
    try {
      applyResult(await openWorkspacePicker())
    } finally {
      setBusy(false)
    }
  }

  const onSubmitPath = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = pathInput.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      applyResult(await openWorkspaceAtPath(trimmed))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack spacing={2} alignItems="center" width="100%">
      <Typography variant="body2" color="text.secondary">
        Open the project folder where you want the topology file saved. Diff Forge reads and writes{' '}
        <code>{'<project>'}.forge.json</code> in that folder.
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<FolderOpenIcon />}
        onClick={onOpen}
        disabled={busy}
        aria-label="Open Folder"
      >
        Open Folder...
      </Button>
      <Divider flexItem>
        <Typography variant="caption" color="text.secondary">
          or paste an absolute path
        </Typography>
      </Divider>
      <Box component="form" onSubmit={onSubmitPath} className="diff-welcome__form">
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            fullWidth
            placeholder="/Users/you/projects/my-diff-project"
            value={pathInput}
            onChange={(e) => setPathInput(e.target.value)}
            disabled={busy}
            inputProps={{
              'aria-label': 'Workspace path',
              spellCheck: 'false',
              autoCapitalize: 'off',
              autoCorrect: 'off'
            }}
          />
          <Button
            type="submit"
            variant="outlined"
            disabled={busy || !pathInput.trim()}
            aria-label="Use path"
            className="diff-welcome__path-btn"
          >
            Use path
          </Button>
        </Stack>
      </Box>
    </Stack>
  )
}

export { WelcomeScreen }
