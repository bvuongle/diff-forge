import { Graph } from '@domain/graph/GraphTypes'

type GraphPersistence = {
  save(graph: Graph): Promise<void>
  load(): Promise<Graph | null>
}

export type { GraphPersistence }
