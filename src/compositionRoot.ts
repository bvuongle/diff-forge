import type { CatalogSource } from '@contracts/CatalogSource'
import type { GraphPersistence } from '@contracts/GraphPersistence'
import type { TopologyExporter } from '@contracts/TopologyExporter'

type AppServices = {
  catalogSource: CatalogSource
  topologyExporter: TopologyExporter
  graphPersistence: GraphPersistence
}

export type { AppServices }
