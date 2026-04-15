import { useEffect } from 'react'

import { MainLayout } from '@layout/MainLayout'
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { ZodError } from 'zod'

import { CatalogDocumentZ } from '@domain/catalog/CatalogSchema'
import { useCatalogStore } from '@state/catalogStore'

import catalogData from '@/assets/mock/catalog.v1.json'
import { theme } from '@/styles/theme'

function App() {
  const { setCatalog, setLoading, setError } = useCatalogStore()

  useEffect(() => {
    setLoading(true)
    try {
      const catalog = CatalogDocumentZ.parse(catalogData)
      setCatalog(catalog)
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainLayout />
    </ThemeProvider>
  )
}

export { App }
