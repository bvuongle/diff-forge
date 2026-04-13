import { makeCatalog, makeNode } from '@testing/fixtures'
import { describe, expect, it } from 'vitest'
import type { Slot } from '@domain/graph/GraphTypes'
import { createNodeFromCatalog } from './createNodeFromCatalog'

describe('createNodeFromCatalog', () => {
  it('creates camelCase instanceId from type', () => {
    const node = createNodeFromCatalog(makeCatalog(), { x: 100, y: 200 }, [])
    expect(node.instanceId).toBe('linkEth0')
    expect(node.id).toBe('linkEth0')
  })

  it('increments index when existing nodes present', () => {
    const existing = [makeNode('linkEth0')]
    const node = createNodeFromCatalog(makeCatalog(), { x: 0, y: 0 }, existing)
    expect(node.instanceId).toBe('linkEth1')
  })

  it('fills gaps in sequential indexing', () => {
    const existing = [makeNode('linkEth0'), makeNode('linkEth2')]
    const node = createNodeFromCatalog(makeCatalog(), { x: 0, y: 0 }, existing)
    expect(node.instanceId).toBe('linkEth1')
  })

  it('builds output slots from implements', () => {
    const catalog = makeCatalog({
      versions: {
        '1.0.0': {
          implements: ['ILink', 'IMonitor'],
          requires: [],
          configSchema: {}
        }
      }
    })
    const node = createNodeFromCatalog(catalog, { x: 0, y: 0 }, [])
    const outSlots = node.slots.filter((s: Slot) => s.direction === 'out')
    expect(outSlots).toHaveLength(2)
    expect(outSlots[0].name).toBe('ILink')
    expect(outSlots[1].name).toBe('IMonitor')
  })

  it('builds input slots from requires', () => {
    const node = createNodeFromCatalog(makeCatalog(), { x: 0, y: 0 }, [])
    const inSlots = node.slots.filter((s: Slot) => s.direction === 'in')
    expect(inSlots).toHaveLength(1)
    expect(inSlots[0].name).toBe('transport')
    expect(inSlots[0].interface).toBe('ITransport')
    expect(inSlots[0].maxConnections).toBe(1)
  })

  it('sets position, componentType, module, version correctly', () => {
    const node = createNodeFromCatalog(makeCatalog(), { x: 42, y: 99 }, [])
    expect(node.position).toEqual({ x: 42, y: 99 })
    expect(node.componentType).toBe('LinkEth')
    expect(node.module).toBe('link')
    expect(node.version).toBe('1.0.0')
  })

  it('starts with empty config', () => {
    const node = createNodeFromCatalog(makeCatalog(), { x: 0, y: 0 }, [])
    expect(node.config).toEqual({})
  })

  it('defaults version to first key in versions record', () => {
    const catalog = makeCatalog({
      versions: {
        '2.0.0': { implements: ['ILink'], requires: [], configSchema: {} },
        '1.0.0': { implements: ['ILink'], requires: [], configSchema: {} }
      }
    })
    const node = createNodeFromCatalog(catalog, { x: 0, y: 0 }, [])
    expect(node.version).toBe('2.0.0')
  })
})
