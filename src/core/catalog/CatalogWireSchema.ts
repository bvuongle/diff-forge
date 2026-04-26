import { z } from 'zod'

import { CatalogComponentZ, type CatalogComponent } from './CatalogSchema'

const ComponentFragmentZ = CatalogComponentZ.omit({ source: true })

type ComponentFragment = z.infer<typeof ComponentFragmentZ>

function fragmentToComponent(fragment: ComponentFragment, source: string): CatalogComponent {
  return { ...fragment, source }
}

export { ComponentFragmentZ, fragmentToComponent }
export type { ComponentFragment }
