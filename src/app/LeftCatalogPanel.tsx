import {
  Box,
  Chip,
  Divider,
  List,
  ListItemButton,
  Stack,
  Typography
} from '@mui/material'
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined'
import { SearchInput } from './SearchInput'
import { SectionHeader } from './SectionHeader'
import { useCatalogStore } from '@state/catalogStore'
import { useUIStore } from '@state/uiStore'

function LeftCatalogPanel() {
  const { catalog, loading, error } = useCatalogStore()
  const { searchQuery } = useUIStore()

  const components = catalog?.components ?? []
  const filtered = searchQuery
    ? components.filter(
        (c) =>
          c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.module.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : components

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
        <SectionHeader title="Component Catalog" />
        <SearchInput />
      </Box>
      <Divider />
      <Box flex={1} overflow="auto" px={1} py={1} minHeight={0}>
        {loading && (
          <Typography variant="body2" color="text.secondary" px={1}>
            Loading catalog...
          </Typography>
        )}
        {error && (
          <Typography variant="body2" color="error" px={1}>
            {error}
          </Typography>
        )}
        {!loading && !error && filtered.length === 0 && (
          <Typography variant="body2" color="text.secondary" px={1}>
            No matches found.
          </Typography>
        )}
        {!loading && !error && filtered.length > 0 && (
          <List dense disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filtered.map((component) => (
              <ListItemButton
                key={`${component.module}-${component.type}`}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(
                    'application/x-diff-component',
                    JSON.stringify(component)
                  )
                  event.dataTransfer.effectAllowed = 'copy'
                }}
                sx={{
                  alignItems: 'flex-start',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'var(--panel-border)',
                  bgcolor: 'var(--panel-bg)',
                  cursor: 'grab',
                  '&:hover': {
                    bgcolor: 'var(--accent-blue-light)'
                  }
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start" width="100%">
                  <WidgetsOutlinedIcon fontSize="small" sx={{ color: 'var(--text-secondary)' }} />
                  <Box flex={1} minWidth={0}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {component.type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {component.module}
                    </Typography>
                    <Box mt={1}>
                      <Chip
                        size="small"
                        label={(() => {
                          const keys = Object.keys(component.versions)
                          return keys.length === 1 ? `v${keys[0]}` : `${keys.length} versions`
                        })()}
                        sx={{ bgcolor: 'var(--input-background)', height: 22 }}
                      />
                    </Box>
                  </Box>
                </Stack>
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
      <Divider />
      <Box px={2} py={1.5}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            Components
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {filtered.length}
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}

export { LeftCatalogPanel }
