import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '@testing/test-utils'

import { HotkeyReferenceDialog } from './HotkeyReferenceDialog'
import { HOTKEY_SECTIONS } from './hotkeys'

describe('HotkeyReferenceDialog', () => {
  it('does not render content when closed', () => {
    renderWithTheme(<HotkeyReferenceDialog open={false} onClose={() => {}} />)
    expect(screen.queryByText(/keyboard & mouse reference/i)).not.toBeInTheDocument()
  })

  it('renders every section title when open', () => {
    renderWithTheme(<HotkeyReferenceDialog open onClose={() => {}} />)
    for (const section of HOTKEY_SECTIONS) {
      expect(screen.getByText(section.title)).toBeInTheDocument()
    }
  })

  it('renders every hotkey description', () => {
    renderWithTheme(<HotkeyReferenceDialog open onClose={() => {}} />)
    for (const section of HOTKEY_SECTIONS) {
      for (const hk of section.hotkeys) {
        expect(screen.getByText(hk.description)).toBeInTheDocument()
      }
    }
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    renderWithTheme(<HotkeyReferenceDialog open onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
