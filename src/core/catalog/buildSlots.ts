import { Slot } from '@core/graph/GraphTypes'

import { CatalogComponent } from './CatalogSchema'

function buildSlots(component: CatalogComponent): Slot[] {
  const slots: Slot[] = []

  for (const iface of component.implements) {
    slots.push({
      name: iface,
      interface: iface,
      direction: 'out',
      maxConnections: Infinity
    })
  }

  for (const req of component.requires) {
    slots.push({
      name: req.slot,
      interface: req.interface,
      direction: 'in',
      maxConnections: req.max
    })
  }

  return slots
}

export { buildSlots }
