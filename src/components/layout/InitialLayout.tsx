import { Box, Divider, Stack, Typography } from '@mui/material'
import { CatalogSection } from '@welcome/CatalogSection'
import { WorkspaceSection } from '@welcome/WorkspaceSection'

function InitialLayout() {
  return (
    <Box className="diff-welcome">
      <Stack spacing={3} alignItems="center" className="diff-welcome__stack">
        <Box component="img" src="/logo.svg" alt="Diff Forge" className="diff-welcome__logo" />
        <Typography variant="h4" color="text.primary">
          Welcome to Diff Forge
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Diff Forge needs a component catalog and a project folder. Complete both steps to start composing topologies.
        </Typography>
        <CatalogSection />
        <Divider flexItem />
        <WorkspaceSection />
        <Typography variant="caption" color="text.secondary">
          Tip: once both are set, launch with <code>diff_forge .</code> from a project folder to skip this screen.
        </Typography>
      </Stack>
    </Box>
  )
}

export { InitialLayout }
