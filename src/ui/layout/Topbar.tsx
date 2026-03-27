import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import SaveIcon from '@mui/icons-material/Save'
import DownloadIcon from '@mui/icons-material/Download'

function Topbar() {
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
