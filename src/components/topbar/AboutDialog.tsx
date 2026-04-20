import CloseIcon from '@mui/icons-material/Close'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material'

const APP_VERSION = '0.1.0'
const BUG_REPORT_EMAIL = 'bvuongleduc@gmail.com'
const AUTHOR = 'Binh Vuong'

type Props = { open: boolean; onClose: () => void }

function AboutDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="diff-about__title">
        About Diff Forge
        <IconButton aria-label="Close" onClick={onClose} className="diff-about__close-btn">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Version {APP_VERSION} - {AUTHOR}
        </Typography>

        <Typography variant="body2" paragraph>
          Visual composer for C++ dependency graphs consumed by the diff framework. Drag components from the catalog
          onto the canvas, wire their dependencies, and export a topology.json the C++ builder turns into a binary.
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="subtitle2" gutterBottom>
          Getting started
        </Typography>
        <List dense disablePadding>
          <ListItem disableGutters className="diff-about__list-item">
            <ListItemText
              primary="Launch from a project folder"
              secondary="Run `diff_forge .` from the project directory, or use Open Folder to pick one."
            />
          </ListItem>
          <ListItem disableGutters className="diff-about__list-item">
            <ListItemText
              primary="Point the catalog at your Artifactory repos"
              secondary="Set Artifactory URLs in environment variables before launch. The catalog is read once at startup."
            />
          </ListItem>
          <ListItem disableGutters className="diff-about__list-item">
            <ListItemText
              primary="Export to topology.json"
              secondary="Click Export Topology to write <project>.forge.json into the current workspace. Re-open the workspace to load it."
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="subtitle2" gutterBottom>
          Report an issue
        </Typography>
        <Typography variant="body2">
          Found a bug or have feedback? Email{' '}
          <Link href={`mailto:${BUG_REPORT_EMAIL}`} underline="hover">
            {BUG_REPORT_EMAIL}
          </Link>
          .
        </Typography>
      </DialogContent>
    </Dialog>
  )
}

export { AboutDialog }
