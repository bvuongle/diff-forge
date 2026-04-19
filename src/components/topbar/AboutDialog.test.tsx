import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '@testing/test-utils'

import { AboutDialog } from './AboutDialog'

describe('AboutDialog', () => {
  it('does not render content when closed', () => {
    renderWithTheme(<AboutDialog open={false} onClose={() => {}} />)
    expect(screen.queryByText(/about diff forge/i)).not.toBeInTheDocument()
  })

  it('renders author attribution when open', () => {
    renderWithTheme(<AboutDialog open onClose={() => {}} />)
    expect(screen.getByText(/binh vuong/i)).toBeInTheDocument()
  })

  it('renders a mailto bug report link', () => {
    renderWithTheme(<AboutDialog open onClose={() => {}} />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toMatch(/^mailto:.+@.+\..+/)
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    renderWithTheme(<AboutDialog open onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
