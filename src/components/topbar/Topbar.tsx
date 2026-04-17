import DownloadIcon from '@mui/icons-material/Download'
import { AppBar, Box, Button, Toolbar, Tooltip, Typography } from '@mui/material'

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
        <Typography variant="h6" color="text.primary">
          Diff Forge
        </Typography>
        <Box flex={1} />
        <Tooltip title="Save project topology">
          <Button
            size="small"
            variant="contained"
            startIcon={<DownloadIcon fontSize="small" />}
            sx={{ bgcolor: 'var(--accent-blue)' }}
          >
            Save Project
          </Button>
        </Tooltip>
      </Toolbar>
    </AppBar>
  )
}

export { Topbar }
