import { GraphPersistence } from '@ports/GraphPersistence'
import { Graph } from '@domain/graph/GraphTypes'

type FileGraphPersistenceDeps = {
  saveFile(path: string, content: string): Promise<void>
  loadFile(path: string): Promise<string | null>
}

function createFileGraphPersistence(deps: FileGraphPersistenceDeps): GraphPersistence {
  return {
    async save(graph: Graph): Promise<void> {
      const json = JSON.stringify(graph, null, 2)
      await deps.saveFile('graph.json', json)
    },

    async load(): Promise<Graph | null> {
      try {
        const content = await deps.loadFile('graph.json')
        if (!content) return null
        return JSON.parse(content)
      } catch {
        return null
      }
    }
  }
}

export { createFileGraphPersistence }
export type { FileGraphPersistenceDeps }
