import { useEffect } from 'react'

import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { ZodError } from 'zod'

import { CatalogDocumentZ } from '@domain/catalog/CatalogSchema'
import { topologyToGraph } from '@domain/topology/topologyToGraph'
import { useCatalogStore } from '@state/catalogStore'
import { useGraphStore } from '@state/graphStore'
import { notify } from '@state/notificationsStore'
import { useWorkspaceStore } from '@state/workspaceStore'
import { getWorkspaceStatus } from '@adapters/electronWorkspace'
import { loadTopologyFromWorkspace } from '@adapters/topologyLoader'
import { MainLayout } from '@layout/MainLayout'
import { NotificationHost } from '@layout/NotificationHost'
import { useAppHotkeys } from '@layout/useAppHotkeys'
import { WelcomeScreen } from '@layout/WelcomeScreen'

import catalogData from '@/assets/mock/catalog.v1.json'
import { theme } from '@/styles/theme'

function App() {
  const { setCatalog, setLoading, setError } = useCatalogStore()
  const catalog = useCatalogStore((s) => s.catalog)
  const setGraph = useGraphStore((s) => s.setGraph)
  const workspace = useWorkspaceStore((s) => s.status)
  const setWorkspaceStatus = useWorkspaceStore((s) => s.setStatus)

  useAppHotkeys()

  useEffect(() => {
    setLoading(true)
    try {
      const loaded = CatalogDocumentZ.parse(catalogData)
      setCatalog(loaded)
    } catch (err) {
      if (err instanceof ZodError) {
        setError(`Invalid catalog schema: ${err.issues.length} validation error(s)`)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load catalog')
      }
    } finally {
      setLoading(false)
    }
  }, [setCatalog, setLoading, setError])

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

  const showWelcome = workspace !== null && !workspace.valid

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {showWelcome ? <WelcomeScreen /> : <MainLayout />}
      <NotificationHost />
    </ThemeProvider>
  )
}

export { App }
