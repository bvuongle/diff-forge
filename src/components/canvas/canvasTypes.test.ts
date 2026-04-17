import { makeEdge, makeNode } from '@testing/fixtures'
import { describe, expect, it } from 'vitest'

import { OUT_HANDLE_ID } from './canvasConstants'
import { toCanvasEdges, toCanvasNodes } from './canvasTypes'

describe('toCanvasNodes', () => {
  it('converts graph nodes to React Flow nodes', () => {
    const nodes = [makeNode('n1', { position: { x: 10, y: 20 } })]
    const result = toCanvasNodes(nodes)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('n1')
    expect(result[0].type).toBe('component')
    expect(result[0].position).toEqual({ x: 10, y: 20 })
    expect(result[0].data.graphNode).toBe(nodes[0])
  })

  it('returns empty array for empty input', () => {
    expect(toCanvasNodes([])).toEqual([])
  })
})

describe('toCanvasEdges', () => {
  it('converts graph edges to React Flow edges', () => {
    const edges = [makeEdge('e1', 'n1', 'n2')]
    const result = toCanvasEdges(edges)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('e1')
    expect(result[0].type).toBe('component')
    expect(result[0].source).toBe('n1')
    expect(result[0].target).toBe('n2')
    expect(result[0].sourceHandle).toBe(OUT_HANDLE_ID)
    expect(result[0].targetHandle).toBe('transport')
    expect(result[0].data?.graphEdge).toBe(edges[0])
  })

  it('sets arrow marker on edges', () => {
    const edges = [makeEdge('e1', 'n1', 'n2')]
    const result = toCanvasEdges(edges)
    expect(result[0].markerEnd).toBeDefined()
  })

  it('returns empty array for empty input', () => {
    expect(toCanvasEdges([])).toEqual([])
  })
})
