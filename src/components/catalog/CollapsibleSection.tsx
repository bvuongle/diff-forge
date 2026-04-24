import { useState, type ReactNode } from 'react'

import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Collapse, IconButton, Stack } from '@mui/material'

import { SectionHeader } from './SectionHeader'

type CollapsibleSectionProps = {
  title: string
  count: number
  defaultExpanded?: boolean
  children: ReactNode
}

function CollapsibleSection({ title, count, defaultExpanded = true, children }: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const label = `${title} (${count})`

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        px={1}
        pb={0.5}
        onClick={() => setExpanded((prev) => !prev)}
        sx={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <SectionHeader title={label} />
        <IconButton
          size="small"
          aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
          aria-expanded={expanded}
          sx={{ p: 0.25 }}
        >
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Stack>
      <Collapse in={expanded} unmountOnExit>
        {children}
      </Collapse>
    </Box>
  )
}

export { CollapsibleSection }
