import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { CatalogComponent } from '@domain/catalog/CatalogTypes'
import type { GraphNode } from '@domain/graph/GraphTypes'
import { renderWithTheme } from '@testing/test-utils'

import { NodeConfigurationSection } from './NodeConfigurationSection'

describe('NodeConfigurationSection', () => {
  const node = { id: 'n1', config: { count: 5 } } as unknown as GraphNode
  const catalogComponent = {
    configSchema: {
      count: { type: 'int32', default: 0 }
    }
  } as unknown as CatalogComponent

  it('renders configuration fields by default', () => {
    renderWithTheme(
      <NodeConfigurationSection node={node} catalogComponent={catalogComponent} updateNodeConfig={vi.fn()} />
    )
    expect(screen.getByText('Fields')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('count')).toBeInTheDocument()
  })

  it('switches to JSON editor', () => {
    renderWithTheme(
      <NodeConfigurationSection node={node} catalogComponent={catalogComponent} updateNodeConfig={vi.fn()} />
    )

    const jsonTab = screen.getByText('JSON')
    fireEvent.click(jsonTab)

    expect(jsonTab).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('returns null if no config schema entries', () => {
    const { container } = renderWithTheme(
      <NodeConfigurationSection
        node={node}
        catalogComponent={{ configSchema: {} } as unknown as CatalogComponent}
        updateNodeConfig={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('calls updateNodeConfig when field changes', () => {
    const updateNodeConfig = vi.fn()
    renderWithTheme(
      <NodeConfigurationSection node={node} catalogComponent={catalogComponent} updateNodeConfig={updateNodeConfig} />
    )

    const input = screen.getByLabelText('count')
    fireEvent.change(input, { target: { value: '10' } })
    fireEvent.blur(input)

    expect(updateNodeConfig).toHaveBeenCalledWith('n1', { count: 10 })
  })
})
