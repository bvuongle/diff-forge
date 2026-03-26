import React, { useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { MainLayout } from '@ui/layout/MainLayout'
import { theme } from '@/styles/theme'
import { useCatalogStore } from '@state/catalogStore'
import catalogData from '@/assets/mock/catalog.v0.json'
import type { CatalogDocument } from '@domain/catalog/CatalogTypes'

function App() {
  const { setCatalog, setLoading, setError } = useCatalogStore()

  useEffect(() => {
    const loadCatalog = async () => {
      setLoading(true)
      try {
        setCatalog(catalogData as unknown as CatalogDocument)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load catalog')
      } finally {
        setLoading(false)
      }
    }

    loadCatalog()
  }, [setCatalog, setLoading, setError])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainLayout />
    </ThemeProvider>
  )
}

export { App }
