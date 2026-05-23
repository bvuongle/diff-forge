import { mkdtemp, readdir, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { CatalogComponent } from '@core/catalog/CatalogSchema'

import { createFsCatalogCache } from './FsCatalogCache'

const URL_A = 'https://art.example/artifactory/repoA'
const URL_B = 'https://art.example/artifactory/repoB'

function makeComponent(type: string, version: string, source: string): CatalogComponent {
  return {
    type,
    version,
    source,
    implements: ['ILink'],
    requires: [],
    config: {}
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

  it('returns null when no cache exists', async () => {
    const cache = createFsCatalogCache({ baseDir })
    expect(await cache.readCache()).toBeNull()
  })

  it('writes a component to its own .json file under the repo dir', async () => {
    const cache = createFsCatalogCache({ baseDir })
    const c = makeComponent('LinkEth', '1.0.0', URL_A)
    await cache.writeCache(c)
    const cached = await cache.readCache()
    expect(cached).toEqual({ components: [c] })
  })

  it('persists per-component layout: <root>/<sha1(url)>/<type>@<version>.json', async () => {
    const cache = createFsCatalogCache({ baseDir })
    await cache.writeCache(makeComponent('LinkEth', '1.0.0', URL_A))
    await cache.writeCache(makeComponent('LinkEth', '1.1.0', URL_A))
    const root = path.join(baseDir, 'catalog-cache')
    const repoDirs = await readdir(root)
    expect(repoDirs).toHaveLength(1)
    expect(repoDirs[0]).toMatch(/^[a-f0-9]{40}$/)
    const files = await readdir(path.join(root, repoDirs[0]))
    expect(files.sort()).toEqual(['LinkEth@1.0.0.json', 'LinkEth@1.1.0.json'])
  })

  it('merges across multiple repos on read', async () => {
    const cache = createFsCatalogCache({ baseDir })
    const a = makeComponent('LinkEth', '1.0.0', URL_A)
    const b = makeComponent('LinkGsm', '1.0.0', URL_B)
    await cache.writeCache(a)
    await cache.writeCache(b)
    const cached = await cache.readCache()
    expect(cached?.components.map((c) => `${c.type}@${c.version}`).sort()).toEqual(['LinkEth@1.0.0', 'LinkGsm@1.0.0'])
  })

  it('treats trailing slash and case as the same source URL', async () => {
    const cache = createFsCatalogCache({ baseDir })
    await cache.writeCache(makeComponent('LinkEth', '1.0.0', URL_A))
    await cache.writeCache(makeComponent('LinkEth', '1.0.0', `${URL_A}/`))
    await cache.writeCache(makeComponent('LinkEth', '1.0.0', URL_A.toUpperCase()))
    const root = path.join(baseDir, 'catalog-cache')
    const repoDirs = await readdir(root)
    expect(repoDirs).toHaveLength(1)
  })

  it('overwrites a component on rewrite', async () => {
    const cache = createFsCatalogCache({ baseDir })
    const original = makeComponent('LinkEth', '1.0.0', URL_A)
    await cache.writeCache(original)
    const fresher = { ...original, implements: ['ILink', 'IMonitorable'] }
    await cache.writeCache(fresher)
    const cached = await cache.readCache()
    expect(cached?.components).toEqual([fresher])
  })

  it('clearRepo removes only the targeted source URL', async () => {
    const cache = createFsCatalogCache({ baseDir })
    await cache.writeCache(makeComponent('LinkEth', '1.0.0', URL_A))
    await cache.writeCache(makeComponent('LinkGsm', '1.0.0', URL_B))
    await cache.clearRepo(URL_A)
    const cached = await cache.readCache()
    expect(cached?.components.map((c) => c.type)).toEqual(['LinkGsm'])
  })

  it('clearRepo on an unknown URL is a silent noop', async () => {
    const cache = createFsCatalogCache({ baseDir })
    await cache.writeCache(makeComponent('LinkEth', '1.0.0', URL_A))
    await cache.clearRepo('https://unknown.example/conan')
    const cached = await cache.readCache()
    expect(cached?.components).toHaveLength(1)
  })

  it('clear removes everything', async () => {
    const cache = createFsCatalogCache({ baseDir })
    await cache.writeCache(makeComponent('LinkEth', '1.0.0', URL_A))
    await cache.writeCache(makeComponent('LinkGsm', '1.0.0', URL_B))
    await cache.clear()
    expect(await cache.readCache()).toBeNull()
  })

  it('skips corrupt component files without failing the whole read', async () => {
    const cache = createFsCatalogCache({ baseDir })
    await cache.writeCache(makeComponent('LinkEth', '1.0.0', URL_A))
    const root = path.join(baseDir, 'catalog-cache')
    const repoDirs = await readdir(root)
    const corruptPath = path.join(root, repoDirs[0], 'corrupt@1.0.0.json')
    await writeFile(corruptPath, 'not-json', 'utf8')
    const cached = await cache.readCache()
    expect(cached?.components).toHaveLength(1)
    expect(cached?.components[0].type).toBe('LinkEth')
  })

  it('returns null when cache dir exists but contains no parseable components', async () => {
    const cache = createFsCatalogCache({ baseDir })
    await cache.writeCache(makeComponent('LinkEth', '1.0.0', URL_A))
    const root = path.join(baseDir, 'catalog-cache')
    const repoDirs = await readdir(root)
    const filePath = path.join(root, repoDirs[0], 'LinkEth@1.0.0.json')
    await writeFile(filePath, 'not-json', 'utf8')
    expect(await cache.readCache()).toBeNull()
  })

  it('writes valid JSON that round-trips through readFile', async () => {
    const cache = createFsCatalogCache({ baseDir })
    const c = makeComponent('LinkEth', '1.0.0', URL_A)
    await cache.writeCache(c)
    const root = path.join(baseDir, 'catalog-cache')
    const repoDirs = await readdir(root)
    const files = await readdir(path.join(root, repoDirs[0]))
    const raw = await readFile(path.join(root, repoDirs[0], files[0]), 'utf8')
    expect(JSON.parse(raw)).toEqual(c)
  })
})
