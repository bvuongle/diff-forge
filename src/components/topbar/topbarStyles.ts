import type { SxProps, Theme } from '@mui/material'

const toolbarSx: SxProps<Theme> = {
  gap: 1,
  minHeight: 48,
  px: 2,
  bgcolor: 'var(--toolbar-bg)',
  borderBottom: '1px solid',
  borderColor: 'var(--panel-border)'
}

const logoSx: SxProps<Theme> = { height: 40, width: 40, mr: 1.5 }

const workspaceChipSx: SxProps<Theme> = { ml: 1, cursor: 'pointer' }

const exportButtonSx: SxProps<Theme> = { bgcolor: 'var(--accent-green, #2e7d32)' }

export { exportButtonSx, logoSx, toolbarSx, workspaceChipSx }
