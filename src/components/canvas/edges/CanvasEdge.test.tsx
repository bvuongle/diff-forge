import { render } from '@testing-library/react'
import { makeEdge, makeNode } from '@testing/fixtures'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useUIStore } from '@state/uiStore'

import { CanvasEdge, PendingEdge } from './CanvasEdge'

describe('CanvasEdge rendering', () => {
  const sourceNode = makeNode('src', {
    position: { x: 100, y: 50 },
    slots: [{ name: 'ILink', interface: 'ILink', direction: 'out', maxConnections: Infinity }]
  })

  const targetNode = makeNode('tgt', {
    position: { x: 400, y: 50 },
    slots: [{ name: 'transport', interface: 'ILink', direction: 'in', maxConnections: 1 }]
  })

  const edge = makeEdge('e1', 'src', 'tgt', {
    sourceSlot: 'ILink',
    targetSlot: 'transport'
  })

  beforeEach(() => {
    // Register port offsets so edges can compute positions
    useUIStore.setState({
      portOffsets: {
        'src:__out__:out': { offsetX: 180, offsetY: 50 },
        'tgt:transport:in': { offsetX: 0, offsetY: 50 }
      }
    })
  })

  afterEach(() => {
    useUIStore.setState({ portOffsets: {} })
  })

  it('renders nothing when source node not found', () => {
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[targetNode]}
          isSelected={false}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    expect(container.querySelector('g')).toBeNull()
  })

  it('renders nothing when target node not found', () => {
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode]}
          isSelected={false}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    expect(container.querySelector('g')).toBeNull()
  })

  it('renders nothing when port offsets are not registered', () => {
    useUIStore.setState({ portOffsets: {} })
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          isSelected={false}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    expect(container.querySelector('g')).toBeNull()
  })

  it('renders a group with paths when both nodes and port offsets exist', () => {
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
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
    expect(paths.length).toBeGreaterThanOrEqual(2)
  })

  it('computes edge path from node position + port offset', () => {
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          isSelected={false}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    const paths = container.querySelectorAll('path')
    const d = paths[paths.length - 1].getAttribute('d')!
    // Source: node(100,50) + offset(180,50) = (280,100)
    // Target: node(400,50) + offset(0,50) = (400,100)
    expect(d).toMatch(/^M 280 100/)
    expect(d).toContain('400 100')
  })

  it('uses default gray stroke for normal edge', () => {
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          isSelected={false}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    const paths = container.querySelectorAll('path')
    const visiblePath = paths[paths.length - 1]
    expect(visiblePath.getAttribute('stroke')).toBe('#9ca3af')
  })

  it('uses red stroke and dashed pattern for invalid edge', () => {
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
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

  it('uses blue stroke when selected', () => {
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
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

  it('renders selection glow path when selected', () => {
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          isSelected={true}
          isInvalid={false}
          isDimmed={false}
          onSelect={() => {}}
        />
      </svg>
    )
    const paths = container.querySelectorAll('path')
    expect(paths.length).toBe(3)
    const glowPath = paths[1]
    expect(glowPath.getAttribute('stroke')).toBe('var(--accent-blue)')
    expect(glowPath.getAttribute('stroke-width')).toBe('6')
  })

  it('sets opacity on group when dimmed', () => {
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
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

  it('calls onSelect with edge id when clicked', () => {
    let selectedId: string | null = null
    const { container } = render(
      <svg>
        <CanvasEdge
          edge={edge}
          nodes={[sourceNode, targetNode]}
          isSelected={false}
          isInvalid={false}
          isDimmed={false}
          onSelect={(id) => {
            selectedId = id
          }}
        />
      </svg>
    )
    const g = container.querySelector('g')!
    g.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(selectedId).toBe('e1')
  })

  it('shows edge label when source has multiple output slots', () => {
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
})

describe('PendingEdge', () => {
  it('renders a dashed gray path', () => {
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

  it('path starts at fromX,fromY', () => {
    const { container } = render(
      <svg>
        <PendingEdge fromX={10} fromY={20} toX={100} toY={200} />
      </svg>
    )
    const d = container.querySelector('path')!.getAttribute('d')!
    expect(d).toMatch(/^M 10 20/)
  })
})
