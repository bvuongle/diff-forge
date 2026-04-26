import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { GraphNode } from '@core/graph/GraphTypes'
import { renderWithTheme } from '@testing/test-utils'

import { NodeInfoSection } from './NodeInfoSection'

describe('NodeInfoSection', () => {
  const node = { id: 'n1', instanceId: 'n1', componentType: 'T1', source: 'S1' } as unknown as GraphNode
  const graphNodes = [node]

  it('renders node info', () => {
    renderWithTheme(<NodeInfoSection node={node} graphNodes={graphNodes} renameNode={vi.fn()} />)
    expect(screen.getByLabelText('Instance ID')).toHaveValue('n1')
    expect(screen.getByText('T1')).toBeInTheDocument()
    expect(screen.getByText('S1')).toBeInTheDocument()
  })

  it('calls renameNode on blur', () => {
    const renameNode = vi.fn()
    renderWithTheme(<NodeInfoSection node={node} graphNodes={graphNodes} renameNode={renameNode} />)

    const input = screen.getByLabelText('Instance ID')
    fireEvent.change(input, { target: { value: 'renamed' } })
    fireEvent.blur(input)

    expect(renameNode).toHaveBeenCalledWith('n1', 'renamed')
  })

  it('shows error for duplicate ID', () => {
    const renameNode = vi.fn()
    const nodes = [node, { id: 'n2', instanceId: 'n2' } as unknown as GraphNode]
    renderWithTheme(<NodeInfoSection node={node} graphNodes={nodes} renameNode={renameNode} />)

    const input = screen.getByLabelText('Instance ID')
    fireEvent.change(input, { target: { value: 'n2' } })
    fireEvent.blur(input)

    expect(screen.getByText('Already in use')).toBeInTheDocument()
    expect(renameNode).not.toHaveBeenCalled()
  })

  it('shows error for empty ID', () => {
    const renameNode = vi.fn()
    renderWithTheme(<NodeInfoSection node={node} graphNodes={graphNodes} renameNode={renameNode} />)

    const input = screen.getByLabelText('Instance ID')
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.blur(input)

    expect(screen.getByText('Cannot be empty')).toBeInTheDocument()
    expect(renameNode).not.toHaveBeenCalled()
  })

  it('calls renameNode on Enter key', () => {
    const renameNode = vi.fn()
    renderWithTheme(<NodeInfoSection node={node} graphNodes={graphNodes} renameNode={renameNode} />)

    const input = screen.getByLabelText('Instance ID')
    fireEvent.change(input, { target: { value: 'renamed' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(renameNode).toHaveBeenCalledWith('n1', 'renamed')
  })
})
