import { useEffect, useRef } from 'react'

import { Backdrop, CircularProgress, CssBaseline, Stack, Typography } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'

import { parseTopology, topologyToGraph } from '@core/topology/topologyToGraph'
import { useCatalogStore } from '@state/catalogStore'
import { useGraphStore } from '@state/graphStore'
import { notify } from '@state/notificationsStore'
import { useWorkspaceStore } from '@state/workspaceStore'
import { ipcCatalogSource } from '@adapters/IpcCatalogSource'
import { ipcWorkspaceStore } from '@adapters/IpcWorkspaceStore'
import { InitialLayout } from '@layout/InitialLayout'
import { MainLayout } from '@layout/MainLayout'
import { NotificationHost } from '@layout/NotificationHost'
import { useAppHotkeys } from '@layout/useAppHotkeys'

import { theme } from '@/styles/theme'

function App() {
  const setCatalogStatus = useCatalogStore((s) => s.setStatus)
  const catalog = useCatalogStore((s) => s.catalog)
  const catalogStatus = useCatalogStore((s) => s.status)
  const setGraph = useGraphStore((s) => s.setGraph)
  const workspace = useWorkspaceStore((s) => s.status)
  const setWorkspaceStatus = useWorkspaceStore((s) => s.setStatus)

  useAppHotkeys()

  useEffect(() => {
    ipcCatalogSource.loadCatalog().then(setCatalogStatus)
  }, [setCatalogStatus])

  useEffect(() => {
    ipcWorkspaceStore.getStatus().then(setWorkspaceStatus)
  }, [setWorkspaceStatus])

  const lastLoadedCwd = useRef<string | null>(null)
  useEffect(() => {
    if (!catalog || !workspace?.valid) return
    if (lastLoadedCwd.current === workspace.cwd) return
    let cancelled = false
    ipcWorkspaceStore.loadTopology().then((result) => {
      if (cancelled) return
      lastLoadedCwd.current = workspace.cwd
      if (result.status === 'loaded') {
        const parsed = parseTopology(result.topology)
        if (parsed.status === 'error') {
          notify.error(`Topology load failed: ${parsed.message}`)
          return
        }
        const { graph } = topologyToGraph(parsed.topology, catalog.components)
        setGraph(graph)
        notify.success(`Loaded ${workspace.name}.forge.json`)
      } else if (result.status === 'notFound') {
        setGraph({ nodes: [], edges: [] })
        notify.info(`Fresh workspace: ${workspace.name} - start drawing`)
      } else if (result.status === 'error') {
        notify.error(`Topology load failed: ${result.message}`)
      }
    })
    return () => {
      cancelled = true
    }
  }, [catalog, workspace, setGraph])

  const workspaceReady = workspace?.valid === true
  const catalogReady = catalogStatus.status === 'ready' || catalogStatus.status === 'partial'
  const showWelcome = !workspaceReady || !catalogReady

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {showWelcome ? <InitialLayout /> : <MainLayout />}
      <Backdrop
        open={catalogStatus.status === 'loading'}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 1, color: 'common.white' }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress color="inherit" />
          <Typography variant="body2">Fetching catalog from configured repositories...</Typography>
        </Stack>
      </Backdrop>
      <NotificationHost />
    </ThemeProvider>
  )
}

export { App }
