import { describe, expect, it } from 'vitest'

import { AUTO_LAYOUT_COLUMN_WIDTH, AUTO_LAYOUT_ROW_HEIGHT } from '@domain/layout/constants'
import { Topology } from '@domain/topology/TopologyTypes'

import { layoutByLevels } from './layoutByLevels'

function entry(id: string, deps: string[] = []): Topology[number] {
  return { type: 'X', id, version: '1.0.0', source: 's', dependencies: deps, config: {} }
}

describe('layoutByLevels', () => {
  it('returns empty map for empty topology', () => {
    expect(layoutByLevels([])).toEqual({})
  })

  it('places leaves (no deps) in column 0', () => {
    const positions = layoutByLevels([entry('a'), entry('b')])
    expect(positions.a.x).toBe(0)
    expect(positions.b.x).toBe(0)
  })

  it('places consumer to the right of its deps', () => {
    const positions = layoutByLevels([entry('a'), entry('b', ['a'])])
    expect(positions.a.x).toBe(0)
    expect(positions.b.x).toBe(AUTO_LAYOUT_COLUMN_WIDTH)
  })

  it('stacks within-level nodes by topology order on y axis', () => {
    const positions = layoutByLevels([entry('a'), entry('b'), entry('c')])
    expect(positions.a).toEqual({ x: 0, y: 0 })
    expect(positions.b).toEqual({ x: 0, y: AUTO_LAYOUT_ROW_HEIGHT })
    expect(positions.c).toEqual({ x: 0, y: AUTO_LAYOUT_ROW_HEIGHT * 2 })
  })

  it('handles deeper chains', () => {
    const positions = layoutByLevels([entry('a'), entry('b', ['a']), entry('c', ['b'])])
    expect(positions.a.x).toBe(0)
    expect(positions.b.x).toBe(AUTO_LAYOUT_COLUMN_WIDTH)
    expect(positions.c.x).toBe(AUTO_LAYOUT_COLUMN_WIDTH * 2)
  })

  it('ignores dangling deps when computing levels', () => {
    const positions = layoutByLevels([entry('a', ['ghost'])])
    expect(positions.a.x).toBe(0)
  })

  it('places cyclic nodes into a fallback level rather than dropping them', () => {
    const positions = layoutByLevels([entry('a', ['b']), entry('b', ['a'])])
    expect(positions.a).toBeDefined()
    expect(positions.b).toBeDefined()
  })

  it('is deterministic — same topology → same positions', () => {
    const topology: Topology = [entry('a'), entry('b', ['a']), entry('c', ['a']), entry('d', ['b', 'c'])]
    expect(layoutByLevels(topology)).toEqual(layoutByLevels(topology))
  })
})
