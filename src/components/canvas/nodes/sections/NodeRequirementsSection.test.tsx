import { screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '@testing/test-utils'

import { NodeRequirementsSection } from './NodeRequirementsSection'

vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    Handle: ({ children, id }: { children?: React.ReactNode; id?: string }) => (
      <div data-testid={`handle-${id}`}>{children}</div>
    )
  }
})

describe('NodeRequirementsSection', () => {
  const defaultProps = {
    nodeId: 'n1',
    inputSlots: [
      { name: 'in1', interface: 'I1', direction: 'in' as const, maxConnections: 1 },
      { name: 'in2', interface: 'I2', direction: 'in' as const, maxConnections: 8 }
    ],
    outputSlots: [{ name: 'out1', interface: 'O1', direction: 'out' as const, maxConnections: Infinity }],
    connectionCounts: new Map([
      ['in1', 1],
      ['in2', 3]
    ]),
    edgeSourceMap: {},
    dragInfo: null
  }

  it('renders input slot names and interfaces', () => {
    renderWithTheme(
      <ReactFlowProvider>
        <NodeRequirementsSection {...defaultProps} />
      </ReactFlowProvider>
    )

    expect(screen.getByText('in1')).toBeInTheDocument()
    expect(screen.getByText('I1')).toBeInTheDocument()
    expect(screen.getByText('in2')).toBeInTheDocument()
    expect(screen.getByText('I2')).toBeInTheDocument()
  })

  it('shows connection count for multi-connection slots', () => {
    renderWithTheme(
      <ReactFlowProvider>
        <NodeRequirementsSection {...defaultProps} />
      </ReactFlowProvider>
    )

    expect(screen.getByText('3/8')).toBeInTheDocument()
    expect(screen.queryByText('1/1')).toBeNull()
  })

  it('renders output interface', () => {
    renderWithTheme(
      <ReactFlowProvider>
        <NodeRequirementsSection {...defaultProps} />
      </ReactFlowProvider>
    )

    expect(screen.getByText('O1')).toBeInTheDocument()
  })

  it('omits output row when no output slots exist', () => {
    renderWithTheme(
      <ReactFlowProvider>
        <NodeRequirementsSection {...defaultProps} outputSlots={[]} />
      </ReactFlowProvider>
    )

    expect(screen.queryByText('O1')).toBeNull()
  })
})
