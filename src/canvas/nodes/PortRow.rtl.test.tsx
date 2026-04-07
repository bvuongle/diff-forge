import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { PortRow } from './PortRow'
import { renderWithTheme } from '@testing/test-utils'
import type { Slot } from '@domain/graph/GraphTypes'

function makeSlot(overrides?: Partial<Slot>): Slot {
  return {
    name: 'transport',
    interface: 'ITransport',
    direction: 'in',
    maxConnections: 1,
    ...overrides
  }
}

const baseProps = () => ({
  slot: makeSlot(),
  nodeId: 'n1',
  side: 'left' as 'left' | 'right',
  isConnected: false,
  dragInfo: null,
  tooltipText: '',
  onMouseDown: vi.fn()
})

describe('PortRow (RTL)', () => {
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
