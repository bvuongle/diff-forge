import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography
} from '@mui/material'

import { HOTKEY_SECTIONS, type Combo } from './hotkeys'

type Props = { open: boolean; onClose: () => void }

function ComboRow({ combo }: { combo: Combo }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
      {combo.chips.map((token, idx) => (
        <Stack key={idx} direction="row" spacing={0.5} alignItems="center">
          {idx > 0 && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ px: 0.25 }}>
              +
            </Typography>
          )}
          <Box component="span" className={`diff-hotkey__kbd${token.length === 1 ? ' diff-hotkey__kbd--mono' : ''}`}>
            {token}
          </Box>
        </Stack>
      ))}
      {combo.note && (
        <Typography component="span" variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
          {combo.note}
        </Typography>
      )}
    </Stack>
  )
}

function HotkeyReferenceDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="diff-hotkey__dialog-title">
        Keyboard & mouse reference
        <IconButton aria-label="Close" onClick={onClose} className="diff-hotkey__close-btn">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {HOTKEY_SECTIONS.map((section, sectionIdx) => (
          <Accordion
            key={section.title}
            defaultExpanded={sectionIdx < 2}
            disableGutters
            elevation={0}
            className="diff-hotkey__section"
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={{ px: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {section.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
              <Stack spacing={1.25}>
                {section.hotkeys.map((hk, hkIdx) => (
                  <Box key={hkIdx} className="diff-hotkey__row">
                    <Typography variant="body2" color="text.primary" className="diff-hotkey__row-label">
                      {hk.description}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                      {hk.combos.map((combo, idx) => (
                        <Stack key={idx} direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                          {idx > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              or
                            </Typography>
                          )}
                          <ComboRow combo={combo} />
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </DialogContent>
    </Dialog>
  )
}

export { HotkeyReferenceDialog }
