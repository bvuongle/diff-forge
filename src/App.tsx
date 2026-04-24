import { useEffect } from 'react'

import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'

import { topologyToGraph } from '@domain/topology/topologyToGraph'
import { useCatalogStore } from '@state/catalogStore'
import { useGraphStore } from '@state/graphStore'
import { notify } from '@state/notificationsStore'
import { useWorkspaceStore } from '@state/workspaceStore'
import { loadCatalog } from '@adapters/catalogLoader'
import { getWorkspaceStatus } from '@adapters/electronWorkspace'
import { loadTopologyFromWorkspace } from '@adapters/topologyLoader'
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
    loadCatalog().then((result) => {
      if (result.status === 'unavailable') {
        setCatalogStatus({
          status: 'error',
          message: 'Catalog IPC unavailable (non-Electron runtime)',
          repos: []
        })
        return
      }
      if (result.status === 'unconfigured') {
        setCatalogStatus({ status: 'unconfigured' })
        return
      }
      if (result.status === 'error') {
        setCatalogStatus({ status: 'error', message: result.message, repos: result.repos })
        return
      }
      setCatalogStatus(result)
    })
  }, [setCatalogStatus])

  useEffect(() => {
    getWorkspaceStatus().then(setWorkspaceStatus)
  }, [setWorkspaceStatus])

  useEffect(() => {
    if (!catalog || !workspace?.valid) return
    let cancelled = false
    loadTopologyFromWorkspace().then((result) => {
      if (cancelled) return
      if (result.status === 'loaded') {
        const { graph } = topologyToGraph(result.topology, catalog.components)
        setGraph(graph)
        notify.success(`Loaded ${workspace.projectName}.forge.json`)
      } else if (result.status === 'notFound') {
        setGraph({ nodes: [], edges: [] })
        notify.info(`Fresh workspace: ${workspace.projectName} - start drawing`)
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
      <NotificationHost />
    </ThemeProvider>
  )
}

export { App }
