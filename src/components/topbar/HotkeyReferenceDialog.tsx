import { useMemo } from 'react'

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

function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
}

const MAC_LABELS: Record<string, string> = {
  mod: '\u2318',
  shift: '\u21E7',
  alt: '\u2325',
  ctrl: '\u2303'
}

const PC_LABELS: Record<string, string> = {
  mod: 'Ctrl',
  shift: 'Shift',
  alt: 'Alt',
  ctrl: 'Ctrl'
}

function chipLabel(token: string, isMac: boolean): string {
  const table = isMac ? MAC_LABELS : PC_LABELS
  return table[token] ?? token
}

type KbdProps = { children: string; mono?: boolean }

function Kbd({ children, mono }: KbdProps) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 26,
        height: 26,
        px: 0.85,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'action.hover',
        color: 'text.primary',
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
        boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.18)'
      }}
    >
      {children}
    </Box>
  )
}

function ComboRow({ combo, isMac }: { combo: Combo; isMac: boolean }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
      {combo.chips.map((token, idx) => (
        <Stack key={`${token}-${idx}`} direction="row" spacing={0.5} alignItems="center">
          {idx > 0 && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ px: 0.25 }}>
              +
            </Typography>
          )}
          <Kbd mono={token.length === 1}>{chipLabel(token, isMac)}</Kbd>
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
  const isMac = useMemo(() => isMacPlatform(), [])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Keyboard & mouse reference
        <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
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
            sx={{
              '&:before': { display: 'none' },
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-of-type': { borderBottom: 'none' }
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={{ px: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {section.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
              <Stack spacing={1.25}>
                {section.hotkeys.map((hk, hkIdx) => (
                  <Stack
                    key={`${section.title}-${hkIdx}`}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ gap: 2 }}
                  >
                    <Typography variant="body2" color="text.primary" sx={{ flex: 1 }}>
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
                          <ComboRow combo={combo} isMac={isMac} />
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
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
