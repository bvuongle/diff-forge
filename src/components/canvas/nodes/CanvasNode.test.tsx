import { fireEvent, screen } from '@testing-library/react'
import { makeCatalog, makeNode } from '@testing/fixtures'
import { renderWithTheme } from '@testing/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CanvasNode } from './CanvasNode'
import type { EdgeSourceMap } from './ports/slotUtils'

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

const defaultProps = (): {
  node: ReturnType<typeof makeNode>
  isSelected: boolean
  isExpanded: boolean
  isDimmed: boolean
  connectedSlots: Set<string>
  catalogComponent: ReturnType<typeof makeCatalog> | null
  dragInfo: null
  edgeSourceMap: EdgeSourceMap
  onSelect: ReturnType<typeof vi.fn>
  onMoveStart: ReturnType<typeof vi.fn>
  onPortMouseDown: ReturnType<typeof vi.fn>
  onToggleExpand: ReturnType<typeof vi.fn>
  onWidthChange: ReturnType<typeof vi.fn>
} => ({
  node: makeNode('n1', {
    componentType: 'LinkEth',
    instanceId: 'linkEth0',
    version: '1.0.0',
    slots: [
      { name: 'transport', interface: 'ITransport', direction: 'in' as const, maxConnections: 1 },
      { name: 'ILink', interface: 'ILink', direction: 'out' as const, maxConnections: Infinity }
    ]
  }),
  isSelected: false,
  isExpanded: false,
  isDimmed: false,
  connectedSlots: new Set<string>(),
  catalogComponent: makeCatalog(),
  dragInfo: null,
  edgeSourceMap: {},
  onSelect: vi.fn(),
  onMoveStart: vi.fn(),
  onPortMouseDown: vi.fn(),
  onToggleExpand: vi.fn(),
  onWidthChange: vi.fn()
})

describe('CanvasNode', () => {
  it('renders componentType and instanceId', () => {
    const props = defaultProps()
    renderWithTheme(<CanvasNode {...props} />)
    expect(screen.getByText('LinkEth')).toBeTruthy()
    expect(screen.getByText('linkEth0')).toBeTruthy()
  })

  it('shows version chip when only one version', () => {
    const props = defaultProps()
    renderWithTheme(<CanvasNode {...props} />)
    expect(screen.getByText('1.0.0')).toBeTruthy()
  })

  it('shows version chip as read-only', () => {
    const props = defaultProps()
    props.catalogComponent = makeCatalog({ version: '2.0.0' })
    renderWithTheme(<CanvasNode {...props} />)
    expect(screen.getByText('1.0.0')).toBeTruthy()
  })

  it('renders input PortRows in collapsed mode', () => {
    const props = defaultProps()
    renderWithTheme(<CanvasNode {...props} />)
    expect(screen.getByText('transport')).toBeTruthy()
    expect(screen.getByText('ITransport')).toBeTruthy()
  })

  it('renders output port circle in collapsed mode', () => {
    const props = defaultProps()
    const { container } = renderWithTheme(<CanvasNode {...props} />)
    const outputPort = container.querySelector('[data-slot-name="__out__"]')
    expect(outputPort).toBeTruthy()
    expect(outputPort?.getAttribute('data-direction')).toBe('out')
  })

  it('renders expanded content when isExpanded and catalogComponent present', () => {
    const props = defaultProps()
    props.isExpanded = true
    props.catalogComponent = makeCatalog({
      version: '1.0.0',
      implements: ['ILink'],
      requires: [{ slot: 'transport', interface: 'ITransport', min: 1, max: 1, order: 0 }],
      configSchema: {}
    })
    renderWithTheme(<CanvasNode {...props} />)
    expect(screen.getByText('INFO')).toBeTruthy()
    expect(screen.getByText('REQUIREMENTS')).toBeTruthy()
  })

  it('does not render expanded content when collapsed', () => {
    const props = defaultProps()
    props.isExpanded = false
    renderWithTheme(<CanvasNode {...props} />)
    expect(screen.queryByText('INFO')).toBeNull()
    expect(screen.queryByText('REQUIREMENTS')).toBeNull()
  })

  it('does not render expanded content without catalogComponent', () => {
    const props = defaultProps()
    props.isExpanded = true
    props.catalogComponent = null
    renderWithTheme(<CanvasNode {...props} />)
    expect(screen.queryByText('INFO')).toBeNull()
  })

  it('triggers onToggleExpand on double-click', () => {
    const props = defaultProps()
    const { container } = renderWithTheme(<CanvasNode {...props} />)
    const nodeBox = container.firstElementChild!
    fireEvent.doubleClick(nodeBox)
    expect(props.onToggleExpand).toHaveBeenCalledWith('n1')
  })

  it('triggers onSelect + onMoveStart on mousedown on non-port area', () => {
    const props = defaultProps()
    renderWithTheme(<CanvasNode {...props} />)
    const instanceId = screen.getByText('linkEth0')
    fireEvent.mouseDown(instanceId)
    expect(props.onSelect).toHaveBeenCalledWith('n1', false)
    expect(props.onMoveStart).toHaveBeenCalledWith('n1', expect.any(Number), expect.any(Number))
  })

  it('does not trigger onSelect when clicking on a port handle', () => {
    const props = defaultProps()
    const { container } = renderWithTheme(<CanvasNode {...props} />)
    const portHandle = container.querySelector('[data-port-handle]')!
    fireEvent.mouseDown(portHandle)
    expect(props.onSelect).not.toHaveBeenCalled()
  })

  it('does not render collapsed ports when expanded', () => {
    const props = defaultProps()
    props.isExpanded = true
    renderWithTheme(<CanvasNode {...props} />)
    expect(screen.queryByText('INFO')).toBeTruthy()
  })

  it('does not render output section when no output slots', () => {
    const props = defaultProps()
    props.node = makeNode('n1', {
      slots: [{ name: 'transport', interface: 'ITransport', direction: 'in', maxConnections: 1 }]
    })
    const { container } = renderWithTheme(<CanvasNode {...props} />)
    const outputPort = container.querySelector('[data-slot-name="__out__"]')
    expect(outputPort).toBeNull()
  })
})
