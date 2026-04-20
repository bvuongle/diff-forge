import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '@testing/test-utils'

import { AboutDialog } from './AboutDialog'

describe('AboutDialog', () => {
  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    renderWithTheme(<AboutDialog open onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
