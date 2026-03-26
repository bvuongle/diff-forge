import React from 'react'
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material'
import FileDownloadIcon from '@mui/icons-material/FileDownload'

function Topbar() {
  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          diff-forge
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<FileDownloadIcon />}
            onClick={() => {
              // TODO: implement export functionality
              console.log('Export topology')
            }}
          >
            Export
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export { Topbar }
