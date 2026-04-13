type TopologyEntry = {
  type: string
  id: string
  dependencies: string[]
  config: Record<string, unknown>
}

type Topology = TopologyEntry[]

export type { TopologyEntry, Topology }
