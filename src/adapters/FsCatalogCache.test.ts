import { mkdtemp, readdir, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { CatalogDocument } from '@core/catalog/CatalogSchema'

import { createFsCatalogCache } from './FsCatalogCache'

const URL_A = 'https://art.example/artifactory/repoA'
const URL_B = 'https://art.example/artifactory/repoB'

function makeDoc(type: string, source: string): CatalogDocument {
  return {
    components: [
      {
        type,
        version: '1.0.0',
        source,
        implements: ['ILink'],
        requires: [],
        configSchema: {}
      }
    ]
  }
}

describe('createFsCatalogCache', () => {
  let baseDir: string

  beforeEach(async () => {
    baseDir = await mkdtemp(path.join(tmpdir(), 'fs-catalog-cache-'))
  })

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true })
  })

  it('returns null when no cache exists for a repo', async () => {
    const cache = createFsCatalogCache({ baseDir })
    expect(await cache.readRepo(URL_A)).toBeNull()
  })

  it('writes and reads back a per-repo catalog', async () => {
    const cache = createFsCatalogCache({ baseDir })
    const doc = makeDoc('LinkEth', URL_A)
    await cache.writeRepo(URL_A, doc)
    const got = await cache.readRepo(URL_A)
    expect(got).toEqual(doc)
  })

  it('isolates per-repo entries by URL', async () => {
    const cache = createFsCatalogCache({ baseDir })
    const docA = makeDoc('LinkEth', URL_A)
    const docB = makeDoc('LinkGsm', URL_B)
    await cache.writeRepo(URL_A, docA)
    await cache.writeRepo(URL_B, docB)
    expect(await cache.readRepo(URL_A)).toEqual(docA)
    expect(await cache.readRepo(URL_B)).toEqual(docB)
  })

  it('treats trailing slash and case as the same URL', async () => {
    const cache = createFsCatalogCache({ baseDir })
    const doc = makeDoc('LinkEth', URL_A)
    await cache.writeRepo(URL_A, doc)
    expect(await cache.readRepo(`${URL_A}/`)).toEqual(doc)
    expect(await cache.readRepo(URL_A.toUpperCase())).toEqual(doc)
  })

  it('overwrites a previously cached document on rewrite', async () => {
    const cache = createFsCatalogCache({ baseDir })
    await cache.writeRepo(URL_A, makeDoc('LinkEth', URL_A))
    const fresher = makeDoc('LinkGsm', URL_A)
    await cache.writeRepo(URL_A, fresher)
    expect(await cache.readRepo(URL_A)).toEqual(fresher)
  })

  it('returns null when the cached file is corrupt JSON', async () => {
    const cache = createFsCatalogCache({ baseDir })
    await cache.writeRepo(URL_A, makeDoc('LinkEth', URL_A))
    const reposDir = path.join(baseDir, 'catalog-cache', 'repos')
    const files = await readdir(reposDir)
    await writeFile(path.join(reposDir, files[0]), 'not-json', 'utf8')
    expect(await cache.readRepo(URL_A)).toBeNull()
  })

  it('persists files under <baseDir>/catalog-cache/repos/', async () => {
    const cache = createFsCatalogCache({ baseDir })
    await cache.writeRepo(URL_A, makeDoc('LinkEth', URL_A))
    const files = await readdir(path.join(baseDir, 'catalog-cache', 'repos'))
    expect(files).toHaveLength(1)
    expect(files[0]).toMatch(/^[a-f0-9]{40}\.json$/)
  })

  it('writes valid JSON that round-trips through readFile', async () => {
    const cache = createFsCatalogCache({ baseDir })
    const doc = makeDoc('LinkEth', URL_A)
    await cache.writeRepo(URL_A, doc)
    const files = await readdir(path.join(baseDir, 'catalog-cache', 'repos'))
    const raw = await readFile(path.join(baseDir, 'catalog-cache', 'repos', files[0]), 'utf8')
    expect(JSON.parse(raw)).toEqual(doc)
  })
})
