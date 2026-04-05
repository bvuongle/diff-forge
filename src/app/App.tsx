import { useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { MainLayout } from '@ui/layout/MainLayout'
import { theme } from '@/styles/theme'
import { useCatalogStore } from '@state/catalogStore'
import { CatalogDocumentZ } from '@domain/catalog/CatalogSchema'
import catalogData from '@/assets/mock/catalog.v1.json'

function App() {
  const { setCatalog, setLoading, setError } = useCatalogStore()

  useEffect(() => {
    setLoading(true)
    try {
      const catalog = CatalogDocumentZ.parse(catalogData)
      setCatalog(catalog)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load catalog')
    } finally {
      setLoading(false)
    }
  }, [setCatalog, setLoading, setError])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainLayout />
    </ThemeProvider>
  )
}

export { App }
