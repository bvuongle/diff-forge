import { fireEvent, screen } from '@testing-library/react'
import { makeCatalog, makeNode } from '@testing/fixtures'
import { renderWithTheme } from '@testing/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CatalogComponent } from '@domain/catalog/CatalogTypes'
import { useGraphStore } from '@state/graphStore'

import { NodeExpandedContent } from './NodeExpandedContent'

function makeCatalogWithConfig(): CatalogComponent {
  return makeCatalog({
    versions: {
      '1.0.0': {
        implements: ['ILink'],
        requires: [{ slot: 'transport', interface: 'ITransport', min: 1, max: 1, order: 0 }],
        configSchema: {
          count: { type: 'int', default: 1 },
          enabled: { type: 'bool', default: false }
        }
      },
      '2.0.0': {
        implements: ['ILink'],
        requires: [],
        configSchema: {}
      }
    }
  })
}

const defaultProps = () => ({
  node: makeNode('n1', {
    componentType: 'LinkEth',
    instanceId: 'linkEth0',
    module: 'link',
    version: '1.0.0',
    config: { count: 3 },
    slots: [
      { name: 'transport', interface: 'ITransport', direction: 'in' as const, maxConnections: 1 },
      { name: 'ILink', interface: 'ILink', direction: 'out' as const, maxConnections: Infinity }
    ]
  }),
  catalogComponent: makeCatalogWithConfig(),
  connectedSlots: new Set<string>(),
  dragInfo: null,
  edgeSourceMap: {},
  onPortMouseDown: vi.fn(),
  onVersionChange: vi.fn()
})

describe('NodeExpandedContent', () => {
  beforeEach(() => {
    const props = defaultProps()
    useGraphStore.setState({
      graph: { nodes: [props.node], edges: [] },
      selectedNodeIds: new Set(),
      selectedEdgeId: null
    })
  })

  it('renders INFO section with type and module', () => {
    const props = defaultProps()
    renderWithTheme(<NodeExpandedContent {...props} />)
    expect(screen.getByText('INFO')).toBeTruthy()
    expect(screen.getByText('LinkEth')).toBeTruthy()
    expect(screen.getByText('link')).toBeTruthy()
  })

  it('renders instance ID text field', () => {
    const props = defaultProps()
    renderWithTheme(<NodeExpandedContent {...props} />)
    const input = screen.getByLabelText('Instance ID') as HTMLInputElement
    expect(input.value).toBe('linkEth0')
  })

  it('renders REQUIREMENTS section with input ports', () => {
    const props = defaultProps()
    renderWithTheme(<NodeExpandedContent {...props} />)
    expect(screen.getByText('REQUIREMENTS')).toBeTruthy()
    expect(screen.getByText('transport')).toBeTruthy()
  })

  it('renders output port in REQUIREMENTS section', () => {
    const props = defaultProps()
    const { container } = renderWithTheme(<NodeExpandedContent {...props} />)
    const outputPort = container.querySelector('[data-slot-name="__out__"]')
    expect(outputPort).toBeTruthy()
  })

  it('renders CONFIGURATION section with config fields', () => {
    const props = defaultProps()
    renderWithTheme(<NodeExpandedContent {...props} />)
    expect(screen.getByText('CONFIGURATION')).toBeTruthy()
    expect(screen.getByText('Fields')).toBeTruthy()
    expect(screen.getByText('JSON')).toBeTruthy()
  })

  it('does not render CONFIGURATION when no config entries', () => {
    const props = defaultProps()
    props.catalogComponent = makeCatalog({
      versions: {
        '1.0.0': { implements: ['ILink'], requires: [], configSchema: {} }
      }
    })
    renderWithTheme(<NodeExpandedContent {...props} />)
    expect(screen.queryByText('CONFIGURATION')).toBeNull()
  })

  it('renders implements chips', () => {
    const props = defaultProps()
    renderWithTheme(<NodeExpandedContent {...props} />)
    const matches = screen.getAllByText('ILink')
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('renders version dropdown with all versions', () => {
    const props = defaultProps()
    renderWithTheme(<NodeExpandedContent {...props} />)
    const versionInput = screen.getByLabelText('Version')
    expect(versionInput).toBeTruthy()
  })

  it('shows rename error for empty instance ID on blur', () => {
    const props = defaultProps()
    renderWithTheme(<NodeExpandedContent {...props} />)
    const input = screen.getByLabelText('Instance ID')
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.blur(input)
    expect(screen.getByText('Cannot be empty')).toBeTruthy()
  })

  it('commits rename on Enter key', () => {
    const props = defaultProps()
    renderWithTheme(<NodeExpandedContent {...props} />)
    const input = screen.getByLabelText('Instance ID')
    fireEvent.change(input, { target: { value: 'newName' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    const node = useGraphStore.getState().graph.nodes[0]
    expect(node.id).toBe('newName')
  })

  it('shows error when renaming to duplicate ID', () => {
    const props = defaultProps()
    useGraphStore.setState({
      graph: {
        nodes: [props.node, makeNode('existingId')],
        edges: []
      }
    })
    renderWithTheme(<NodeExpandedContent {...props} />)
    const input = screen.getByLabelText('Instance ID')
    fireEvent.change(input, { target: { value: 'existingId' } })
    fireEvent.blur(input)
    expect(screen.getByText('Already in use')).toBeTruthy()
  })
})
