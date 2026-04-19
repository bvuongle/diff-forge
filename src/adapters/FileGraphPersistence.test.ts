import { describe, expect, it, vi } from 'vitest'

import { makeEdge, makeNode } from '@testing/fixtures'

import { createFileGraphPersistence } from './FileGraphPersistence'

describe('FileGraphPersistence', () => {
  describe('save', () => {
    it('serializes graph to JSON and calls saveFile', async () => {
      const saveFile = vi.fn().mockResolvedValue(undefined)
      const persistence = createFileGraphPersistence({ saveFile, loadFile: vi.fn() })
      const graph = { nodes: [makeNode('n1')], edges: [makeEdge('e1', 'n1', 'n2')] }
      await persistence.save(graph)
      expect(saveFile).toHaveBeenCalledWith('graph.json', expect.any(String))
      const saved = JSON.parse(saveFile.mock.calls[0][1])
      expect(saved.nodes).toHaveLength(1)
      expect(saved.edges).toHaveLength(1)
    })
  })

  describe('load', () => {
    it('parses valid graph JSON', async () => {
      const graph = { nodes: [makeNode('n1')], edges: [] }
      const loadFile = vi.fn().mockResolvedValue(JSON.stringify(graph))
      const persistence = createFileGraphPersistence({ saveFile: vi.fn(), loadFile })
      const result = await persistence.load()
      expect(result).not.toBeNull()
      expect(result!.nodes).toHaveLength(1)
    })

    it('returns null when file not found', async () => {
      const persistence = createFileGraphPersistence({
        saveFile: vi.fn(),
        loadFile: vi.fn().mockResolvedValue(null)
      })
      const result = await persistence.load()
      expect(result).toBeNull()
    })

    it('returns null for invalid JSON', async () => {
      const persistence = createFileGraphPersistence({
        saveFile: vi.fn(),
        loadFile: vi.fn().mockResolvedValue('not json')
      })
      const result = await persistence.load()
      expect(result).toBeNull()
    })

    it('returns null for JSON missing nodes/edges', async () => {
      const persistence = createFileGraphPersistence({
        saveFile: vi.fn(),
        loadFile: vi.fn().mockResolvedValue(JSON.stringify({ foo: 'bar' }))
      })
      const result = await persistence.load()
      expect(result).toBeNull()
    })
  })
})
