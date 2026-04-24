import { useState } from 'react'

import RefreshIcon from '@mui/icons-material/Refresh'
import { CircularProgress, IconButton, Tooltip } from '@mui/material'

import { useCatalogStore } from '@state/catalogStore'
import { notify } from '@state/notificationsStore'
import { refreshCatalog } from '@adapters/catalogLoader'

function RefreshCatalogButton() {
  const setStatus = useCatalogStore((s) => s.setStatus)
  const [busy, setBusy] = useState(false)

  const onClick = async () => {
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
      if (result.status === 'ready') {
        notify.success(`Catalog refreshed: ${result.catalog.components.length} components`)
      } else if (result.status === 'partial') {
        notify.warning(result.message)
      } else if (result.status === 'error') {
        notify.error(result.message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Tooltip title="Refresh catalog">
      <span>
        <IconButton size="small" onClick={onClick} disabled={busy} aria-label="Refresh catalog">
          {busy ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon fontSize="small" />}
        </IconButton>
      </span>
    </Tooltip>
  )
}

export { RefreshCatalogButton }
