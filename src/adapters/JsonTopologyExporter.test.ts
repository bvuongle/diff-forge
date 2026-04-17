import { describe, expect, it, vi } from 'vitest'

import { createJsonTopologyExporter } from './JsonTopologyExporter'

const topology = [
  { type: 'LinkEth', id: 'linkEth0', dependencies: [], config: {} },
  { type: 'MessageSource', id: 'msg0', dependencies: ['linkEth0'], config: { count: 3 } }
]

describe('JsonTopologyExporter', () => {
  it('exports topology as formatted JSON file', async () => {
    const saveFile = vi.fn().mockResolvedValue(undefined)
    const exporter = createJsonTopologyExporter({ saveFile })
    await exporter.export(topology)
    expect(saveFile).toHaveBeenCalledWith('topology.json', expect.any(String))
    const saved = JSON.parse(saveFile.mock.calls[0][1])
    expect(saved).toHaveLength(2)
    expect(saved[0].type).toBe('LinkEth')
  })

  it('exportToString returns formatted JSON', async () => {
    const exporter = createJsonTopologyExporter({ saveFile: vi.fn() })
    const result = await exporter.exportToString(topology)
    const parsed = JSON.parse(result)
    expect(parsed).toEqual(topology)
  })

  it('formats with 2-space indentation', async () => {
    const exporter = createJsonTopologyExporter({ saveFile: vi.fn() })
    const result = await exporter.exportToString(topology)
    expect(result).toContain('  ')
    expect(result).not.toContain('\t')
  })
})
