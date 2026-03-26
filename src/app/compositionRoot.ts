import { CatalogSource } from '../ports/CatalogSource'
import { TopologyExporter } from '../ports/TopologyExporter'
import { GraphPersistence } from '../ports/GraphPersistence'
import { createFileCatalogSource } from '../adapters/catalog/FileCatalogSource'
import { createJsonTopologyExporter } from '../adapters/export/JsonTopologyExporter'
import { createFileGraphPersistence } from '../adapters/persistence/FileGraphPersistence'

// Wire up ports to adapters. Implement adapters for real file I/O.

type AppServices = {
  catalogSource: CatalogSource
  topologyExporter: TopologyExporter
  graphPersistence: GraphPersistence
}

// Mock file I/O for browser context. In production, use electron IPC.
const mockLoadFile = async (path: string): Promise<string> => {
  // TODO: connect to electron IPC or filesystem
  throw new Error(`File not found: ${path}`)
}

const mockSaveFile = async (_path: string, _content: string): Promise<void> => {
  // TODO: connect to electron IPC or filesystem
  console.log('File save stubbed')
}

function composeServices(): AppServices {
  return {
    catalogSource: createFileCatalogSource({
      filePath: 'src/assets/mock/catalog.v0.json',
      loadFile: mockLoadFile
    }),
    topologyExporter: createJsonTopologyExporter({
      saveFile: mockSaveFile
    }),
    graphPersistence: createFileGraphPersistence({
      saveFile: mockSaveFile,
      loadFile: async () => null
    })
  }
}

export { composeServices }
export type { AppServices }
