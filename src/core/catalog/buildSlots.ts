import { Slot } from '@core/graph/GraphTypes'

import { CatalogComponent } from './CatalogSchema'

function buildSlots(component: CatalogComponent): Slot[] {
  const slots: Slot[] = []

  for (const iface of component.implements) {
    slots.push({
      name: iface,
      type: iface,
      direction: 'out',
      isArray: true
    })
  }

  for (const req of component.requires) {
    slots.push({
      name: req.name,
      type: req.type,
      direction: 'in',
      isArray: req.isArray
    })
  }

  return slots
}

export { buildSlots }
