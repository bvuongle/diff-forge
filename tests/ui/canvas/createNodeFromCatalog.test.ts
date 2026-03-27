import { describe, it, expect } from 'vitest'
import { createNodeFromCatalog } from '@ui/canvas/createNodeFromCatalog'
import { makeNode, makeCatalog } from '../../fixtures'

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
    const node = createNodeFromCatalog(
      makeCatalog({ implements: ['ILink', 'IMonitor'] }),
      { x: 0, y: 0 },
      []
    )
    const outSlots = node.slots.filter(s => s.direction === 'out')
    expect(outSlots).toHaveLength(2)
    expect(outSlots[0].name).toBe('ILink')
    expect(outSlots[1].name).toBe('IMonitor')
  })

  it('builds input slots from requires', () => {
    const node = createNodeFromCatalog(makeCatalog(), { x: 0, y: 0 }, [])
    const inSlots = node.slots.filter(s => s.direction === 'in')
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

  it('defaults version to 0.0.0 when versions array is empty', () => {
    const node = createNodeFromCatalog(
      makeCatalog({ versions: [] }),
      { x: 0, y: 0 },
      []
    )
    expect(node.version).toBe('0.0.0')
  })
})
