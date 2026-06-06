import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { CatalogComponent } from '@core/catalog/CatalogSchema'
import { renderWithTheme } from '@testing/test-utils'

import { CatalogListItem } from './CatalogListItem'

const component: CatalogComponent = {
  type: 'LinkGsm',
  source: 'https://artifactory.example.com/repo/diff',
  version: '2.0.0',
  implements: ['ILink'],
  requires: [{ name: 'modem', type: 'IModem', isArray: false }],
  config: { linkReliability: { type: 'uint8', min: 0, max: 100 } }
}

describe('CatalogListItem', () => {
  it('renders type, version, and source label', () => {
    renderWithTheme(<CatalogListItem component={component} />)
    expect(screen.getByText('LinkGsm')).toBeInTheDocument()
    expect(screen.getByText('v2.0.0')).toBeInTheDocument()
    expect(screen.getByText('diff')).toBeInTheDocument()
  })

  it('shows the interfaces and config schema on hover', async () => {
    renderWithTheme(<CatalogListItem component={component} />)
    fireEvent.mouseOver(screen.getByText('LinkGsm'))
    expect(await screen.findByText(/linkReliability/)).toBeInTheDocument()
  })
})
