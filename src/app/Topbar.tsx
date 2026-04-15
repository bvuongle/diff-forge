import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import FitScreenIcon from '@mui/icons-material/FitScreen'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import NearMeIcon from '@mui/icons-material/NearMe'
import PanToolIcon from '@mui/icons-material/PanTool'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import { AppBar, Box, Button, IconButton, Toolbar, Tooltip, Typography } from '@mui/material'

import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'

function Topbar() {
  const nodes = useGraphStore((s) => s.graph.nodes)
  const { expandAll, collapseAll, canvasMode, setCanvasMode, fitToViewAction, resetViewAction } = useUIStore()

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
        <Box
          sx={{ display: 'flex', border: '1px solid var(--panel-border)', borderRadius: 1, overflow: 'hidden', ml: 1 }}
        >
          <Tooltip title="Select (V)">
            <IconButton
              size="small"
              onClick={() => setCanvasMode('select')}
              sx={{ borderRadius: 0, bgcolor: canvasMode === 'select' ? 'action.selected' : 'transparent' }}
            >
              <NearMeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Pan (H)">
            <IconButton
              size="small"
              onClick={() => setCanvasMode('pan')}
              sx={{ borderRadius: 0, bgcolor: canvasMode === 'pan' ? 'action.selected' : 'transparent' }}
            >
              <PanToolIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box flex={1} />
        <Tooltip title="Expand all nodes">
          <Button
            size="small"
            color="inherit"
            startIcon={<UnfoldMoreIcon fontSize="small" />}
            onClick={() => expandAll(nodes.map((n) => n.id))}
          >
            Expand All
          </Button>
        </Tooltip>
        <Tooltip title="Collapse all nodes">
          <Button size="small" color="inherit" startIcon={<UnfoldLessIcon fontSize="small" />} onClick={collapseAll}>
            Collapse All
          </Button>
        </Tooltip>
        <Tooltip title="Fit to view">
          <Button
            size="small"
            color="inherit"
            startIcon={<FitScreenIcon fontSize="small" />}
            onClick={() => {
              if (fitToViewAction) fitToViewAction()
            }}
          >
            Fit
          </Button>
        </Tooltip>
        <Tooltip title="Reset view (Ctrl+0)">
          <Button
            size="small"
            color="inherit"
            startIcon={<RestartAltIcon fontSize="small" />}
            onClick={() => {
              if (resetViewAction) resetViewAction()
            }}
          >
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
