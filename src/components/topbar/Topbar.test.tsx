import { screen } from '@testing-library/react'
import { renderWithTheme } from '@testing/test-utils'
import { describe, expect, it } from 'vitest'

import { Topbar } from './Topbar'

describe('Topbar', () => {
  it('renders title', () => {
    renderWithTheme(<Topbar />)
    expect(screen.getByText('Diff Forge')).toBeInTheDocument()
  })

  it('renders Save Project button', () => {
    renderWithTheme(<Topbar />)
    expect(screen.getByRole('button', { name: /save project/i })).toBeInTheDocument()
  })
})
