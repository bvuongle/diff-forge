import { Graph } from '@domain/graph/GraphTypes'
import { GraphPersistence } from '@contracts/GraphPersistence'

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
        const data: unknown = JSON.parse(content)
        if (!data || typeof data !== 'object') return null
        const graph = data as Record<string, unknown>
        if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return null
        return data as Graph
      } catch {
        return null
      }
    }
  }
}

export { createFileGraphPersistence }
