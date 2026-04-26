import { useEffect, useState } from 'react'

import FileUploadIcon from '@mui/icons-material/FileUpload'
import FolderIcon from '@mui/icons-material/Folder'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import {
  AppBar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material'

import { reasonMessage } from '@core/workspace/workspaceContext'
import { useGraphStore } from '@state/graphStore'
import { exportTopology, performWorkspaceSwitch, requestWorkspaceSwitch } from '@state/topologyCommands'
import { useUIStore } from '@state/uiStore'
import { useWorkspaceStore } from '@state/workspaceStore'
import { ipcWorkspaceStore } from '@adapters/IpcWorkspaceStore'

import logoUrl from '@/assets/logo.svg'
import { AboutDialog } from './AboutDialog'
import { CatalogHealthIndicator } from './CatalogHealthIndicator'
import { HotkeyReferenceDialog } from './HotkeyReferenceDialog'

function Topbar() {
  const dirty = useGraphStore((s) => s.dirty)
  const workspace = useWorkspaceStore((s) => s.status)
  const setWorkspaceStatus = useWorkspaceStore((s) => s.setStatus)
  const switchConfirmOpen = useUIStore((s) => s.switchConfirmOpen)
  const setSwitchConfirmOpen = useUIStore((s) => s.setSwitchConfirmOpen)

  const [hotkeysOpen, setHotkeysOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)

  useEffect(() => {
    if (workspace === null) ipcWorkspaceStore.getStatus().then(setWorkspaceStatus)
  }, [workspace, setWorkspaceStatus])

  const exportDisabled = !workspace?.valid
  const tooltipTitle = (() => {
    if (workspace === null) return 'Checking workspace...'
    if (!workspace.valid) return reasonMessage(workspace.reason)
    return `Write ${workspace.name}.forge.json to ${workspace.cwd}`
  })()

  const onConfirmDiscard = () => {
    setSwitchConfirmOpen(false)
    performWorkspaceSwitch()
  }

  const openDialog =
    (setter: (open: boolean) => void) =>
    (event: React.MouseEvent<HTMLElement>): void => {
      event.currentTarget.blur()
      setter(true)
    }

  return (
    <AppBar position="static" elevation={0} color="transparent">
      <Toolbar className="diff-topbar__toolbar">
        <Box component="img" src={logoUrl} className="diff-topbar__logo" alt="Logo" />
        <Typography variant="h6" color="text.primary">
          Diff Forge
        </Typography>
        {workspace?.valid && (
          <Tooltip title={`${workspace.cwd} - click to switch workspace`}>
            <Chip
              icon={<FolderIcon fontSize="small" />}
              label={workspace.name + (dirty ? ' *' : '')}
              onClick={(event) => {
                event.currentTarget.blur()
                requestWorkspaceSwitch()
              }}
              size="small"
              variant="outlined"
              aria-label="Switch workspace"
              className="diff-topbar__workspace-chip"
            />
          </Tooltip>
        )}
        <Box className="diff-topbar__spacer" />
        <CatalogHealthIndicator />
        <Tooltip title="Keyboard & mouse reference">
          <IconButton size="small" onClick={openDialog(setHotkeysOpen)} aria-label="Keyboard reference">
            <KeyboardIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="About Diff Forge">
          <IconButton size="small" onClick={openDialog(setAboutOpen)} aria-label="About">
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={tooltipTitle}>
          <span>
            <Button
              size="small"
              variant="contained"
              startIcon={<FileUploadIcon fontSize="small" />}
              onClick={() => exportTopology()}
              disabled={exportDisabled}
              aria-label="Export Topology"
              className="diff-topbar__export-btn"
            >
              Export Topology
            </Button>
          </span>
        </Tooltip>
      </Toolbar>
      <Dialog open={switchConfirmOpen} onClose={() => setSwitchConfirmOpen(false)}>
        <DialogTitle>Unsaved changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Switching workspace will discard unsaved changes. Export the current topology first, or continue and lose
            them.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSwitchConfirmOpen(false)}>Cancel</Button>
          <Button onClick={onConfirmDiscard} color="warning">
            Discard &amp; switch
          </Button>
        </DialogActions>
      </Dialog>
      <HotkeyReferenceDialog open={hotkeysOpen} onClose={() => setHotkeysOpen(false)} />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </AppBar>
  )
}

export { Topbar }
