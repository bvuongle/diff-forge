import { screen } from '@testing-library/react'
import { renderWithTheme } from '@testing/test-utils'
import { describe, expect, it, vi } from 'vitest'

import type { Slot } from '@domain/graph/GraphTypes'

import { getPortDragState } from './portDragState'
import { PortRow } from './PortRow'

function makeSlot(overrides?: Partial<Slot>): Slot {
  return {
    name: 'transport',
    interface: 'ILink',
    direction: 'in',
    maxConnections: 1,
    ...overrides
  }
}

describe('getPortDragState', () => {
  it('returns idle when no drag is active', () => {
    const slot = makeSlot()
    expect(getPortDragState(slot, 'nodeA', null)).toBe('idle')
  })

  it('returns dimmed for the source node itself', () => {
    const slot = makeSlot()
    const dragInfo = { sourceNodeId: 'nodeA', sourceInterfaces: ['ILink'] }
    expect(getPortDragState(slot, 'nodeA', dragInfo)).toBe('dimmed')
  })

  it('returns dimmed for output ports on other nodes', () => {
    const slot = makeSlot({ direction: 'out' })
    const dragInfo = { sourceNodeId: 'nodeA', sourceInterfaces: ['ILink'] }
    expect(getPortDragState(slot, 'nodeB', dragInfo)).toBe('dimmed')
  })

  it('returns valid for input port with matching interface', () => {
    const slot = makeSlot({ direction: 'in', interface: 'ILink' })
    const dragInfo = { sourceNodeId: 'nodeA', sourceInterfaces: ['ILink'] }
    expect(getPortDragState(slot, 'nodeB', dragInfo)).toBe('valid')
  })

  it('returns dimmed for input port with non-matching interface', () => {
    const slot = makeSlot({ direction: 'in', interface: 'IMonitor' })
    const dragInfo = { sourceNodeId: 'nodeA', sourceInterfaces: ['ILink'] }
    expect(getPortDragState(slot, 'nodeB', dragInfo)).toBe('dimmed')
  })

  it('returns valid when source has multiple interfaces and one matches', () => {
    const slot = makeSlot({ direction: 'in', interface: 'IMonitor' })
    const dragInfo = { sourceNodeId: 'nodeA', sourceInterfaces: ['ILink', 'IMonitor'] }
    expect(getPortDragState(slot, 'nodeB', dragInfo)).toBe('valid')
  })

  it('returns dimmed when source interfaces array is empty', () => {
    const slot = makeSlot({ direction: 'in', interface: 'ILink' })
    const dragInfo = { sourceNodeId: 'nodeA', sourceInterfaces: [] }
    expect(getPortDragState(slot, 'nodeB', dragInfo)).toBe('dimmed')
  })
})

const baseProps = () => ({
  slot: makeSlot({ interface: 'ITransport' }),
  nodeId: 'n1',
  side: 'left' as 'left' | 'right',
  isConnected: false,
  dragInfo: null,
  tooltipText: '',
  onMouseDown: vi.fn()
})

describe('PortRow rendering', () => {
  it('renders port circle with correct data attributes', () => {
    const props = baseProps()
    const { container } = renderWithTheme(<PortRow {...props} />)
    const port = container.querySelector('[data-port-handle]')
    expect(port).toBeTruthy()
    expect(port?.getAttribute('data-node-id')).toBe('n1')
    expect(port?.getAttribute('data-slot-name')).toBe('transport')
    expect(port?.getAttribute('data-direction')).toBe('in')
  })

  it('left side: shows slot name and interface chip', () => {
    const props = baseProps()
    renderWithTheme(<PortRow {...props} />)
    expect(screen.getByText('transport')).toBeTruthy()
    expect(screen.getByText('ITransport')).toBeTruthy()
  })

  it('right side: shows interface label only', () => {
    const props = baseProps()
    props.side = 'right'
    renderWithTheme(<PortRow {...props} />)
    expect(screen.getByText('ITransport')).toBeTruthy()
    expect(screen.queryByText('transport')).toBeNull()
  })

  it('hideLabel hides text on left side', () => {
    const props = { ...baseProps(), hideLabel: true }
    renderWithTheme(<PortRow {...props} />)
    expect(screen.queryByText('transport')).toBeNull()
    expect(screen.queryByText('ITransport')).toBeNull()
  })

  it('hideLabel hides text on right side', () => {
    const props = { ...baseProps(), side: 'right' as const, hideLabel: true }
    renderWithTheme(<PortRow {...props} />)
    expect(screen.queryByText('ITransport')).toBeNull()
  })

  it('renders tooltip when tooltipText provided', () => {
    const props = baseProps()
    props.tooltipText = 'Connected to linkEth0'
    const { container } = renderWithTheme(<PortRow {...props} />)
    const port = container.querySelector('[data-port-handle]')
    expect(port).toBeTruthy()
  })

  it('does not wrap in tooltip when tooltipText is empty', () => {
    const props = baseProps()
    props.tooltipText = ''
    const { container } = renderWithTheme(<PortRow {...props} />)
    const port = container.querySelector('[data-port-handle]')
    expect(port).toBeTruthy()
  })
})
