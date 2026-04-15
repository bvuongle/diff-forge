import { Topology } from '@domain/topology/TopologyTypes'

type TopologyExporter = {
  export(topology: Topology): Promise<void>
  exportToString(topology: Topology): Promise<string>
}

export type { TopologyExporter }
