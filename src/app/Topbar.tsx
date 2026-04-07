import { AppBar, Box, Button, Toolbar, Tooltip, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import SaveIcon from '@mui/icons-material/Save'
import DownloadIcon from '@mui/icons-material/Download'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess'
import FitScreenIcon from '@mui/icons-material/FitScreen'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'

function Topbar() {
  const nodes = useGraphStore((s) => s.graph.nodes)
  const { expandAll, collapseAll } = useUIStore()

  return (
    <AppBar position="static" elevation={0} color="transparent">
      <Toolbar
        sx={{
          gap: 1,
          minHeight: 48,
          px: 2,
          bgcolor: 'var(--toolbar-bg)',
          borderBottom: '1px solid',
          borderColor: 'var(--panel-border)'
        }}
      >
        <Typography variant="h6" color="text.primary" sx={{ mr: 1 }}>
          Diff Forge
        </Typography>
        <Button size="small" color="inherit" startIcon={<AddIcon fontSize="small" />}>
          New Project
        </Button>
        <Button size="small" color="inherit" startIcon={<FolderOpenIcon fontSize="small" />}>
          Open
        </Button>
        <Button size="small" color="inherit" startIcon={<SaveIcon fontSize="small" />}>
          Save
        </Button>
        <Box flex={1} />
        <Tooltip title="Expand all nodes">
          <Button size="small" color="inherit" startIcon={<UnfoldMoreIcon fontSize="small" />} onClick={() => expandAll(nodes.map((n) => n.id))}>
            Expand All
          </Button>
        </Tooltip>
        <Tooltip title="Collapse all nodes">
          <Button size="small" color="inherit" startIcon={<UnfoldLessIcon fontSize="small" />} onClick={collapseAll}>
            Collapse All
          </Button>
        </Tooltip>
        <Tooltip title="Fit to view">
          <Button size="small" color="inherit" startIcon={<FitScreenIcon fontSize="small" />} onClick={() => {
            const fn = (window as unknown as Record<string, unknown>).__canvasFitToView
            if (typeof fn === 'function') fn()
          }}>
            Fit
          </Button>
        </Tooltip>
        <Tooltip title="Reset view (Ctrl+0)">
          <Button size="small" color="inherit" startIcon={<RestartAltIcon fontSize="small" />} onClick={() => {
            const fn = (window as unknown as Record<string, unknown>).__canvasResetView
            if (typeof fn === 'function') fn()
          }}>
            Reset
          </Button>
        </Tooltip>
        <Button
          size="small"
          variant="contained"
          startIcon={<DownloadIcon fontSize="small" />}
          sx={{ bgcolor: 'var(--accent-blue)' }}
        >
          Export JSON
        </Button>
      </Toolbar>
    </AppBar>
  )
}

export { Topbar }
