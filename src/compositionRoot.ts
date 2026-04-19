import type { CatalogSource } from '@contracts/CatalogSource'
import type { GraphPersistence } from '@contracts/GraphPersistence'
import type { ProjectExporter } from '@contracts/ProjectExporter'

type AppServices = {
  catalogSource: CatalogSource
  projectExporter: ProjectExporter
  graphPersistence: GraphPersistence
}

export type { AppServices }
