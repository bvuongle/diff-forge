import { Box, Divider, List, Stack, Typography } from '@mui/material'

import type { CatalogComponent } from '@domain/catalog/CatalogSchema'
import { searchCatalog, type SearchResult } from '@domain/catalog/searchCatalog'
import { useCatalogStore } from '@state/catalogStore'
import { useUIStore } from '@state/uiStore'

import { CatalogListItem } from './CatalogListItem'
import { CollapsibleSection } from './CollapsibleSection'
import { RefreshCatalogButton } from './RefreshCatalogButton'
import { SearchInput } from './SearchInput'
import { SearchModeToggle } from './SearchModeToggle'
import { SectionHeader } from './SectionHeader'

function CatalogPanel() {
  const status = useCatalogStore((s) => s.status)
  const catalog = useCatalogStore((s) => s.catalog)
  const searchQuery = useUIStore((s) => s.searchQuery)
  const searchMode = useUIStore((s) => s.searchMode)

  const loading = status.status === 'loading'
  const errorMessage = status.status === 'error' ? status.message : status.status === 'partial' ? status.message : null

  const components = catalog?.components ?? []
  const result = searchCatalog(components, searchQuery, searchMode)
  const totalCount = result.kind === 'flat' ? result.matches.length : result.provides.length + result.accepts.length
  const placeholder = searchMode === 'name' ? 'Search by name...' : 'Search by interface...'

  return (
    <Box
      display="flex"
      flexDirection="column"
      borderRight={1}
      borderColor="var(--panel-border)"
      bgcolor="var(--panel-bg)"
      minHeight={0}
    >
      <Box px={2} pt={2} pb={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <SectionHeader title="Component Catalog" />
          <RefreshCatalogButton />
        </Stack>
        <Stack spacing={1}>
          <SearchModeToggle />
          <SearchInput placeholder={placeholder} />
        </Stack>
      </Box>
      <Divider />
      <Box flex={1} overflow="auto" px={1} py={1} minHeight={0}>
        {loading && (
          <Typography variant="body2" color="text.secondary" px={1}>
            Loading catalog...
          </Typography>
        )}
        {errorMessage && (
          <Typography variant="body2" color="error" px={1}>
            {errorMessage}
          </Typography>
        )}
        {!loading && !errorMessage && <ResultsView result={result} />}
      </Box>
      <Divider />
      <Box px={2} py={1.5}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            Components
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {totalCount}
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}

function ResultsView({ result }: { result: SearchResult }) {
  if (result.kind === 'flat') {
    if (result.matches.length === 0) return <EmptyState />
    return <ComponentList components={result.matches} />
  }

  const empty = result.provides.length === 0 && result.accepts.length === 0
  if (empty) return <EmptyState />

  return (
    <Stack spacing={1.5}>
      {result.provides.length > 0 && (
        <CollapsibleSection title="Provides" count={result.provides.length}>
          <ComponentList components={result.provides} />
        </CollapsibleSection>
      )}
      {result.accepts.length > 0 && (
        <CollapsibleSection title="Accepts" count={result.accepts.length}>
          <ComponentList components={result.accepts} />
        </CollapsibleSection>
      )}
    </Stack>
  )
}

function ComponentList({ components }: { components: CatalogComponent[] }) {
  return (
    <List dense disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {components.map((component) => (
        <CatalogListItem key={`${component.source}-${component.type}-${component.version}`} component={component} />
      ))}
    </List>
  )
}

function EmptyState() {
  return (
    <Typography variant="body2" color="text.secondary" px={1}>
      No matches found.
    </Typography>
  )
}

export { CatalogPanel }
