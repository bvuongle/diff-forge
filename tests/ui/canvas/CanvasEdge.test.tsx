import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { makeNode, makeEdge } from '../../fixtures'

// CanvasEdge exports getPortPosition and buildCurvePath indirectly; test via rendering
// We can test the exported component and constants directly

// getPortPosition and buildCurvePath are not exported, so we test them through the component
// However, we CAN import the constants and test the component rendering behavior

import { NODE_WIDTH_COMPACT, NODE_WIDTH_EXPANDED, EXPANDED_PORT_TOP } from '@ui/canvas/CanvasEdge'

describe('CanvasEdge constants', () => {
  it('NODE_WIDTH_COMPACT is 240', () => {
    expect(NODE_WIDTH_COMPACT).toBe(240)
  })

  it('NODE_WIDTH_EXPANDED is 340', () => {
    expect(NODE_WIDTH_EXPANDED).toBe(340)
  })

  it('EXPANDED_PORT_TOP is 280', () => {
    expect(EXPANDED_PORT_TOP).toBe(280)
  })
})

// To test getPortPosition and buildCurvePath we need to access them.
// They are not exported. We test behavior through the rendered SVG path.

describe('CanvasEdge rendering', () => {
  const sourceNode = makeNode('src', {
    position: { x: 100, y: 50 },
    slots: [
      { name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: Infinity }
    ]
  })

  const targetNode = makeNode('tgt', {
    position: { x: 400, y: 50 },
    slots: [
      { name: 'transport', interface: 'ILink', direction: 'in', maxConnections: 1 }
    ]
  })

  const edge = makeEdge('e1', 'src', 'tgt', {
    sourceSlot: 'ILink',
    targetSlot: 'transport'
  })

  // We need to import CanvasEdge dynamically to wrap in SVG
  it('renders nothing when source node not found', async () => {
    const { CanvasEdge } = await import('@ui/canvas/CanvasEdge')
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[targetNode]}
          expandedNodeIds={new Set()}
          nodeWidths={{}}
          isSelected={false}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    // When source node is missing, returns null
    expect(container.querySelector('g')).toBeNull()
  })

  it('renders nothing when target node not found', async () => {
    const { CanvasEdge } = await import('@ui/canvas/CanvasEdge')
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode]}
          expandedNodeIds={new Set()}
          nodeWidths={{}}
          isSelected={false}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    expect(container.querySelector('g')).toBeNull()
  })

  it('renders a group element with path when both nodes exist', async () => {
    const { CanvasEdge } = await import('@ui/canvas/CanvasEdge')
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          expandedNodeIds={new Set()}
          nodeWidths={{}}
          isSelected={false}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    const g = container.querySelector('g')
    expect(g).not.toBeNull()
    const paths = g!.querySelectorAll('path')
    // At least a hit-area path + the visible stroke path
    expect(paths.length).toBeGreaterThanOrEqual(2)
  })

  it('uses green stroke for valid connected edge', async () => {
    const { CanvasEdge } = await import('@ui/canvas/CanvasEdge')
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          expandedNodeIds={new Set()}
          nodeWidths={{}}
          isSelected={false}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    const paths = container.querySelectorAll('path')
    const visiblePath = paths[paths.length - 1]
    expect(visiblePath.getAttribute('stroke')).toBe('#22c55e')
  })

  it('uses red stroke and dashed pattern for invalid edge', async () => {
    const { CanvasEdge } = await import('@ui/canvas/CanvasEdge')
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          expandedNodeIds={new Set()}
          nodeWidths={{}}
          isSelected={false}
          isInvalid={true}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    const paths = container.querySelectorAll('path')
    const visiblePath = paths[paths.length - 1]
    expect(visiblePath.getAttribute('stroke')).toBe('#ef4444')
    expect(visiblePath.getAttribute('stroke-dasharray')).toBe('6,4')
  })

  it('uses blue stroke when selected', async () => {
    const { CanvasEdge } = await import('@ui/canvas/CanvasEdge')
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          expandedNodeIds={new Set()}
          nodeWidths={{}}
          isSelected={true}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    const paths = container.querySelectorAll('path')
    const visiblePath = paths[paths.length - 1]
    expect(visiblePath.getAttribute('stroke')).toBe('var(--accent-blue)')
  })

  it('renders selection glow path when selected', async () => {
    const { CanvasEdge } = await import('@ui/canvas/CanvasEdge')
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          expandedNodeIds={new Set()}
          nodeWidths={{}}
          isSelected={true}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    // Selected edge has: hit-area, glow (strokeWidth=6 blue), visible stroke = 3 paths
    const paths = container.querySelectorAll('path')
    expect(paths.length).toBe(3)
    // Glow path is the second one
    const glowPath = paths[1]
    expect(glowPath.getAttribute('stroke')).toBe('var(--accent-blue)')
    expect(glowPath.getAttribute('stroke-width')).toBe('6')
  })

  it('renders invalid glow path when invalid and not selected', async () => {
    const { CanvasEdge } = await import('@ui/canvas/CanvasEdge')
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          expandedNodeIds={new Set()}
          nodeWidths={{}}
          isSelected={false}
          isInvalid={true}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    const paths = container.querySelectorAll('path')
    // invalid + not selected: hit-area, invalid glow, visible = 3 paths
    expect(paths.length).toBe(3)
    const glowPath = paths[1]
    expect(glowPath.getAttribute('stroke')).toBe('#ef4444')
  })

  it('sets opacity on group when dimmed', async () => {
    const { CanvasEdge } = await import('@ui/canvas/CanvasEdge')
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          expandedNodeIds={new Set()}
          nodeWidths={{}}
          isSelected={false}
          isInvalid={false}
          isDimmed={true}
          onSelect={() => {}}
        />
      </svg>
    )
    const g = container.querySelector('g')
    expect(g!.getAttribute('opacity')).toBe('0.15')
  })

  it('sets full opacity when not dimmed', async () => {
    const { CanvasEdge } = await import('@ui/canvas/CanvasEdge')
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          expandedNodeIds={new Set()}
          nodeWidths={{}}
          isSelected={false}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    const g = container.querySelector('g')
    expect(g!.getAttribute('opacity')).toBe('1')
  })

  it('calls onSelect with edge id when clicked', async () => {
    const { CanvasEdge } = await import('@ui/canvas/CanvasEdge')
    let selectedId: string | null = null
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          expandedNodeIds={new Set()}
          nodeWidths={{}}
          isSelected={false}
          isInvalid={false}
          isDimmed={false}
          onSelect={(id) => { selectedId = id }}
        />
      </svg>
    )
    const g = container.querySelector('g')!
    g.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(selectedId).toBe('e1')
  })

  it('shows edge label near source when source has multiple output slots', async () => {
    const { CanvasEdge } = await import('@ui/canvas/CanvasEdge')
    const multiOutputSource = makeNode('src', {
      position: { x: 100, y: 50 },
      slots: [
        { name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: Infinity },
        { name: 'IMonitor', interface: 'IMonitor', direction: 'out', maxConnections: Infinity }
      ]
    })
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[multiOutputSource, targetNode]}
          expandedNodeIds={new Set()}
          nodeWidths={{}}
          isSelected={false}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    const text = container.querySelector('text')
    expect(text).not.toBeNull()
    expect(text!.textContent).toBe('ILink')
  })

  it('does not show edge label when source has single output slot', async () => {
    const { CanvasEdge } = await import('@ui/canvas/CanvasEdge')
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          expandedNodeIds={new Set()}
          nodeWidths={{}}
          isSelected={false}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    const text = container.querySelector('text')
    expect(text).toBeNull()
  })

  it('path d attribute contains M and C commands (cubic bezier)', async () => {
    const { CanvasEdge } = await import('@ui/canvas/CanvasEdge')
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          expandedNodeIds={new Set()}
          nodeWidths={{}}
          isSelected={false}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    const paths = container.querySelectorAll('path')
    const d = paths[paths.length - 1].getAttribute('d')!
    expect(d).toMatch(/^M /)
    expect(d).toContain('C ')
  })
})

describe('PendingEdge', () => {
  it('renders a dashed gray path', async () => {
    const { PendingEdge } = await import('@ui/canvas/CanvasEdge')
    const { container } = render(
      <svg>
        <PendingEdge fromX={0} fromY={0} toX={100} toY={100} />
      </svg>
    )
    const path = container.querySelector('path')
    expect(path).not.toBeNull()
    expect(path!.getAttribute('stroke')).toBe('#9ca3af')
    expect(path!.getAttribute('stroke-dasharray')).toBe('6,4')
    expect(path!.getAttribute('pointer-events')).toBe('none')
  })

  it('path starts at fromX,fromY', async () => {
    const { PendingEdge } = await import('@ui/canvas/CanvasEdge')
    const { container } = render(
      <svg>
        <PendingEdge fromX={10} fromY={20} toX={100} toY={200} />
      </svg>
    )
    const d = container.querySelector('path')!.getAttribute('d')!
    expect(d).toMatch(/^M 10 20/)
  })
})
