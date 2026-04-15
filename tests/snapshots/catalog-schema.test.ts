import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

import { CatalogDocumentZ } from '@domain/catalog/CatalogSchema'

describe('Catalog schema snapshot', () => {
  const catalogPath = path.resolve(__dirname, '../../src/assets/mock/catalog.v1.json')
  const raw = fs.readFileSync(catalogPath, 'utf-8')
  const parsed = JSON.parse(raw)

  it('mock catalog validates against CatalogDocumentZ', () => {
    const result = CatalogDocumentZ.safeParse(parsed)
    expect(result.success).toBe(true)
  })

  it('component count matches snapshot', () => {
    expect(parsed.components.length).toMatchSnapshot()
  })

  it('component types match snapshot', () => {
    const types = parsed.components.map((c: { type: string; version: string }) => `${c.type}@${c.version}`)
    expect(types).toMatchSnapshot()
  })

  it('config type variety matches snapshot', () => {
    const result = CatalogDocumentZ.parse(parsed)
    const configTypes = new Set<string>()
    for (const comp of result.components) {
      for (const field of Object.values(comp.configSchema)) {
        configTypes.add(field.type)
      }
    }
    expect([...configTypes].sort()).toMatchSnapshot()
  })
})
