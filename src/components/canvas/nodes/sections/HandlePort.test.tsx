import React from 'react'

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HandlePort } from './HandlePort'

vi.mock('@xyflow/react', () => ({
  Handle: ({ className, style, type, id, isConnectable, ...rest }: Record<string, unknown>) => (
    <div
      data-testid="handle"
      data-type={type}
      data-id={id}
      data-connectable={String(isConnectable)}
      className={className as string}
      style={style as React.CSSProperties}
      {...rest}
    />
  ),
  Position: { Left: 'left', Right: 'right' }
}))

const defaultProps = {
  nodeId: 'node-1',
  type: 'source' as const,
  handleId: 'h1',
  isConnected: false,
  isConnectable: false,
  isValid: false,
  isDimmed: false,
  side: 'left' as const
}

describe('HandlePort', () => {
  it('renders with handle-port--left class for left side', () => {
    render(<HandlePort {...defaultProps} side="left" />)
    const handle = screen.getByTestId('handle')
    expect(handle.className).toContain('handle-port--left')
    expect(handle.className).not.toContain('handle-port--right')
  })

  it('renders with handle-port--right class for right side', () => {
    render(<HandlePort {...defaultProps} side="right" />)
    const handle = screen.getByTestId('handle')
    expect(handle.className).toContain('handle-port--right')
    expect(handle.className).not.toContain('handle-port--left')
  })

  it('applies handle-port--connectable class when connectable', () => {
    render(<HandlePort {...defaultProps} isConnectable={true} />)
    const handle = screen.getByTestId('handle')
    expect(handle.className).toContain('handle-port--connectable')
  })

  it('applies handle-port--dimmed class when dimmed', () => {
    render(<HandlePort {...defaultProps} isDimmed={true} />)
    const handle = screen.getByTestId('handle')
    expect(handle.className).toContain('handle-port--dimmed')
  })

  it('uses connected color when isConnected is true', () => {
    render(<HandlePort {...defaultProps} isConnected={true} />)
    const handle = screen.getByTestId('handle')
    expect(handle.style.background).toBe('var(--port-connected)')
    expect(handle.style.border).toBe('2px solid var(--port-connected)')
  })

  it('uses connected color when isValid is true', () => {
    render(<HandlePort {...defaultProps} isValid={true} />)
    const handle = screen.getByTestId('handle')
    expect(handle.style.background).toBe('var(--port-connected)')
    expect(handle.style.border).toBe('2px solid var(--port-connected)')
  })

  it('uses idle color when neither connected nor valid', () => {
    render(<HandlePort {...defaultProps} isConnected={false} isValid={false} />)
    const handle = screen.getByTestId('handle')
    expect(handle.style.background).toBe('rgb(255, 255, 255)')
    expect(handle.style.border).toBe('2px solid var(--panel-border)')
  })
})
