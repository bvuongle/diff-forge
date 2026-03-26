import { Topology } from '../domain/topology/TopologyTypes'

// Port: defines how topology data leaves the system

type TopologyExporter = {
  export(topology: Topology): Promise<void>
  exportToString(topology: Topology): Promise<string>
}

export type { TopologyExporter }
