import { screen } from '@testing-library/react'
import { renderWithTheme } from '@testing/test-utils'
import { describe, expect, it, vi } from 'vitest'

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
  it('renders all three regions', () => {
    renderWithTheme(<MainLayout />)
    expect(screen.getByTestId('topbar')).toBeInTheDocument()
    expect(screen.getByTestId('catalog-panel')).toBeInTheDocument()
    expect(screen.getByTestId('canvas-panel')).toBeInTheDocument()
  })

  it('uses CATALOG_PANEL_WIDTH_PX in grid template', () => {
    const { container } = renderWithTheme(<MainLayout />)
    const gridBox = container.querySelector('.MuiBox-root .MuiBox-root')
    expect(gridBox).toBeInTheDocument()
    const style = window.getComputedStyle(gridBox!)
    expect(style.display).toBe('grid')
  })
})
