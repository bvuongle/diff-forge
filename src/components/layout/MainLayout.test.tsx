import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUIStore } from '@state/uiStore'
import { renderWithTheme } from '@testing/test-utils'

import { MainLayout } from './MainLayout'

vi.mock('@topbar/Topbar', () => ({
  Topbar: () => <div data-testid="topbar">Topbar</div>
}))

vi.mock('@catalog/CatalogPanel', () => ({
  CatalogPanel: () => <div data-testid="catalog-panel">Catalog</div>
}))

vi.mock('@catalog/CollapsedCatalogBar', () => ({
  CollapsedCatalogBar: () => <div data-testid="catalog-collapsed-bar">Collapsed</div>
}))

vi.mock('@canvas/CanvasPanel', () => ({
  CanvasPanel: () => <div data-testid="canvas-panel">Canvas</div>
}))

describe('MainLayout', () => {
  beforeEach(() => {
    useUIStore.setState({ catalogPanelCollapsed: false })
  })

  it('renders the catalog panel and canvas when expanded', () => {
    renderWithTheme(<MainLayout />)
    expect(screen.getByTestId('topbar')).toBeInTheDocument()
    expect(screen.getByTestId('catalog-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('catalog-collapsed-bar')).not.toBeInTheDocument()
    expect(screen.getByTestId('canvas-panel')).toBeInTheDocument()
  })

  it('swaps in the collapsed bar when collapsed', () => {
    useUIStore.setState({ catalogPanelCollapsed: true })
    renderWithTheme(<MainLayout />)
    expect(screen.getByTestId('catalog-collapsed-bar')).toBeInTheDocument()
    expect(screen.queryByTestId('catalog-panel')).not.toBeInTheDocument()
  })
})
