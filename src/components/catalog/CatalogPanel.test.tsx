import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useUIStore } from '@state/uiStore'
import { renderWithTheme } from '@testing/test-utils'

import { CatalogPanel } from './CatalogPanel'

describe('CatalogPanel collapse', () => {
  afterEach(() => {
    useUIStore.setState({ catalogPanelCollapsed: false })
  })

  it('shows the full panel with a hide control when expanded', () => {
    useUIStore.setState({ catalogPanelCollapsed: false })
    renderWithTheme(<CatalogPanel />)
    expect(screen.getByText('COMPONENT CATALOG')).toBeInTheDocument()
    expect(screen.getByLabelText('Hide catalog')).toBeInTheDocument()
    expect(screen.queryByLabelText('Show catalog')).not.toBeInTheDocument()
  })

  it('collapses to a rail with a show control', () => {
    useUIStore.setState({ catalogPanelCollapsed: true })
    renderWithTheme(<CatalogPanel />)
    expect(screen.getByLabelText('Show catalog')).toBeInTheDocument()
    expect(screen.queryByText('COMPONENT CATALOG')).not.toBeInTheDocument()
  })
})
