import { useMemo, useState } from 'react'

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Alert, Box, Divider, IconButton, List, Stack, Tooltip, Typography } from '@mui/material'

import type { CatalogComponent } from '@core/catalog/CatalogSchema'
import { listSources, searchCatalog, type SearchResult } from '@core/catalog/searchCatalog'
import { useCatalogStore } from '@state/catalogStore'
import { useUIStore } from '@state/uiStore'

import { CatalogListItem } from './CatalogListItem'
import { CollapsibleSection } from './CollapsibleSection'
import { RefreshCatalogButton } from './RefreshCatalogButton'
import { SearchInput } from './SearchInput'
import { SearchModeToggle } from './SearchModeToggle'
import { SectionHeader } from './SectionHeader'
import { SourceFilter } from './SourceFilter'

function CatalogPanel() {
  const status = useCatalogStore((s) => s.status)
  const catalog = useCatalogStore((s) => s.catalog)
  const searchQuery = useUIStore((s) => s.searchQuery)
  const searchMode = useUIStore((s) => s.searchMode)
  const sourceFilters = useUIStore((s) => s.sourceFilters)

  const collapsed = useUIStore((s) => s.catalogPanelCollapsed)
  const toggleCollapsed = useUIStore((s) => s.toggleCatalogPanelCollapsed)

  const loading = status.status === 'loading'
  const errorMessage = status.status === 'error' ? status.message : null
  const warningMessage = status.status === 'partial' ? status.message : null

  const components = useMemo(() => catalog?.components ?? [], [catalog])
  const sources = useMemo(() => listSources(components), [components])
  const result = useMemo(
    () => searchCatalog(components, searchQuery, searchMode, sourceFilters),
    [components, searchQuery, searchMode, sourceFilters]
  )
  const totalCount = result.kind === 'flat' ? result.matches.length : result.provides.length + result.accepts.length

  return (
    <Box flex={1} display="grid" gridTemplateColumns="auto 1fr" minHeight={0}>
      {collapsed ? (
        <Box
          width={36}
          display="flex"
          flexDirection="column"
          alignItems="center"
          pt={1}
          borderRight={1}
          borderColor="var(--panel-border)"
          bgcolor="var(--panel-bg)"
        >
          <Tooltip title="Show catalog" placement="right">
            <IconButton size="small" onClick={toggleCollapsed} aria-label="Show catalog">
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box
          display="flex"
          flexDirection="column"
          width={280}
          borderRight={1}
          borderColor="var(--panel-border)"
          bgcolor="var(--panel-bg)"
          minHeight={0}
        >
          <Box px={2} pt={2} pb={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.5} mb={1}>
              <SectionHeader title="Component Catalog" />
              <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
                <RefreshCatalogButton />
                <Tooltip title="Hide catalog">
                  <IconButton size="small" onClick={toggleCollapsed} aria-label="Hide catalog">
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <SearchInput />
              <SourceFilter sources={sources} />
            </Stack>
            <SearchModeToggle />
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
            {!loading && !errorMessage && (
              <Stack spacing={1}>
                {warningMessage && <DismissibleWarning key={warningMessage} message={warningMessage} />}
                <ResultsView result={result} />
              </Stack>
            )}
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
      )}
    </Box>
  )
}

function DismissibleWarning({ message }: { message: string }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <Alert severity="warning" variant="outlined" onClose={() => setDismissed(true)} sx={{ mx: 1 }}>
      {message}
    </Alert>
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
    <List dense disablePadding className="diff-catalog-results">
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
