import React from 'react'
import { Paper, Box, Divider, Typography, List, ListItem, ListItemText } from '@mui/material'
import { SearchInput } from '../components/SearchInput'
import { SectionHeader } from '../components/SectionHeader'
import { useCatalogStore } from '@state/catalogStore'

function LeftCatalogPanel() {
  const { catalog } = useCatalogStore()

  const components = catalog?.components || []

  return (
    <Paper
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 0
      }}
    >
      <Box sx={{ p: 2 }}>
        <SectionHeader title="Component Catalog" />
        <SearchInput />
      </Box>

      <Divider />

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {components.length === 0 ? (
          <Typography variant="body2" sx={{ p: 1, color: 'text.secondary' }}>
            No components available
          </Typography>
        ) : (
          <List dense>
            {components.map((component) => (
              <ListItem
                key={component.type}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  borderRadius: 1,
                  mb: 0.5
                }}
              >
                <ListItemText
                  primary={component.type}
                  secondary={component.module}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  )
}

export { LeftCatalogPanel }
