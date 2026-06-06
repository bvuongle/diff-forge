import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '@testing/test-utils'

import { MainLayout } from './MainLayout'

vi.mock('@topbar/Topbar', () => ({
  Topbar: () => <div data-testid="topbar">Topbar</div>
}))

vi.mock('@catalog/CatalogPanel', () => ({
  CatalogPanel: () => <div data-testid="catalog-panel">Catalog</div>
}))

vi.mock('@canvas/CanvasPanel', () => ({
  CanvasPanel: () => <div data-testid="canvas-panel">Canvas</div>
}))

describe('MainLayout', () => {
  it('renders the topbar, catalog panel, and canvas', () => {
    renderWithTheme(<MainLayout />)
    expect(screen.getByTestId('topbar')).toBeInTheDocument()
    expect(screen.getByTestId('catalog-panel')).toBeInTheDocument()
    expect(screen.getByTestId('canvas-panel')).toBeInTheDocument()
  })
})
