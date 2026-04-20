import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '@testing/test-utils'

import { HotkeyReferenceDialog } from './HotkeyReferenceDialog'

describe('HotkeyReferenceDialog', () => {
  it('renders when open', () => {
    renderWithTheme(<HotkeyReferenceDialog open onClose={() => {}} />)
    expect(screen.getByText(/keyboard & mouse reference/i)).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    renderWithTheme(<HotkeyReferenceDialog open onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
