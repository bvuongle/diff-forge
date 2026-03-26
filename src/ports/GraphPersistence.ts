import { Graph } from '../domain/graph/GraphTypes'

// Port: defines how graph state is persisted and loaded

type GraphPersistence = {
  save(graph: Graph): Promise<void>
  load(): Promise<Graph | null>
}

export type { GraphPersistence }
