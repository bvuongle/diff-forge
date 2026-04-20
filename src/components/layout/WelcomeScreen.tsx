import { FormEvent, useEffect, useRef, useState } from 'react'

import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import { Box, Button, Divider, Stack, TextField, Typography } from '@mui/material'

import { reasonMessage } from '@domain/workspace/workspaceContext'
import { notify } from '@state/notificationsStore'
import { useWorkspaceStore } from '@state/workspaceStore'
import { openWorkspaceAtPath, openWorkspacePicker, type OpenWorkspaceResult } from '@adapters/electronWorkspace'

function WelcomeScreen() {
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
    <Box className="diff-welcome">
      <Stack spacing={3} alignItems="center" className="diff-welcome__stack">
        <Box component="img" src="/logo.svg" alt="Diff Forge" className="diff-welcome__logo" />
        <Typography variant="h4" color="text.primary">
          Welcome to Diff Forge
        </Typography>
        <Typography variant="body1" color="text.secondary">
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
        <Typography variant="caption" color="text.secondary">
          Tip: launch with <code>diff_forge .</code> from a project folder to skip this screen.
        </Typography>
      </Stack>
    </Box>
  )
}

export { WelcomeScreen }
