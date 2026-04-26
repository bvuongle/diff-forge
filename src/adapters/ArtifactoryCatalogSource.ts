import { gunzipSync } from 'node:zlib'

import { z } from 'zod'

import { CatalogComponentZ, type CatalogComponent, type CatalogDocument } from '@core/catalog/CatalogSchema'
import { mergeCatalogs } from '@core/catalog/mergeCatalogs'
import type { CatalogCache } from '@contracts/CatalogCache'
import type { CatalogLoadOutcome, CatalogSource, RepoLoadOutcome } from '@contracts/CatalogSource'

const ARTIFACTORY_REPOS = 'DF_ARTIFACTORY_REPOS'
const ARTIFACTORY_TOKEN = 'DF_ARTIFACTORY_TOKEN'
const METADATA_FILENAME = 'diff.metadata.json'
const EXPORT_TARBALL = 'conan_export.tgz'

type FetchFn = typeof fetch

type Deps = {
  env: Record<string, string | undefined>
  fetch: FetchFn
  cache: CatalogCache
}

type ArtifactoryConfig =
  | { status: 'unconfigured'; missing: string[] }
  | { status: 'configured'; repoUrls: string[]; token: string | null }
  | { status: 'invalid'; message: string }

type RepoLoadOk = { status: 'ok'; url: string; catalog: CatalogDocument }
type RepoLoadStale = { status: 'stale'; url: string; catalog: CatalogDocument; reason: string }
type RepoLoadFailed = { status: 'failed'; url: string; reason: string }
type RepoLoadResult = RepoLoadOk | RepoLoadStale | RepoLoadFailed

const SearchResponseZ = z.object({
  results: z.array(z.string())
})

const RevisionsResponseZ = z.object({
  revisions: z
    .array(
      z.object({
        revision: z.string(),
        time: z.string().optional()
      })
    )
    .min(1)
})

function createArtifactoryCatalogSource(deps: Deps): CatalogSource {
  return {
    async loadCatalog(): Promise<CatalogLoadOutcome> {
      const config = parseConfig(deps.env)
      if (config.status === 'unconfigured') return { status: 'unconfigured', missing: config.missing }
      if (config.status === 'invalid') return { status: 'error', message: config.message, repos: [] }

      const results = await Promise.all(
        config.repoUrls.map((url) => loadOneRepo(deps.fetch, deps.cache, url, config.token))
      )

      const repos: RepoLoadOutcome[] = results.map(toRepoOutcome)
      const loaded = results.filter((r): r is RepoLoadOk | RepoLoadStale => r.status !== 'failed')
      const failed = results.filter((r): r is RepoLoadFailed => r.status === 'failed')
      const stale = results.filter((r): r is RepoLoadStale => r.status === 'stale')

      if (loaded.length === 0) {
        const noun = failed.length === 1 ? 'repository' : 'repositories'
        return {
          status: 'error',
          message: `${failed.length} ${noun} failed to fetch.`,
          repos
        }
      }

      const catalog = mergeCatalogs(loaded.map((r) => r.catalog))
      if (failed.length === 0 && stale.length === 0) {
        return { status: 'ready', catalog, repos }
      }

      return {
        status: 'partial',
        catalog,
        repos,
        message: buildPartialMessage(results.length, stale.length, failed.length)
      }
    }
  }
}

function buildPartialMessage(total: number, stale: number, failed: number): string {
  const noun = total === 1 ? 'repository' : 'repositories'
  const parts: string[] = []
  if (stale > 0) parts.push(`${stale} using cached data`)
  if (failed > 0) parts.push(`${failed} failed with no cache`)
  return `${parts.join(', ')} of ${total} ${noun}. Showing partial catalog.`
}

function parseConfig(env: Record<string, string | undefined>): ArtifactoryConfig {
  const raw = env[ARTIFACTORY_REPOS]?.trim()
  if (!raw) return { status: 'unconfigured', missing: [ARTIFACTORY_REPOS] }

  const urls = raw
    .split(',')
    .map((u) => u.trim())
    .filter((u) => u.length > 0)

  if (urls.length === 0) return { status: 'unconfigured', missing: [ARTIFACTORY_REPOS] }

  const duplicates = findDuplicateUrls(urls)
  if (duplicates.length > 0) {
    return {
      status: 'invalid',
      message: `Duplicate repository URLs: ${duplicates.join(', ')}. Each URL must be distinct.`
    }
  }

  const token = env[ARTIFACTORY_TOKEN]?.trim() || null
  return { status: 'configured', repoUrls: urls, token }
}

function findDuplicateUrls(urls: string[]): string[] {
  const seen = new Map<string, number>()
  for (const u of urls) {
    const key = normalizeUrl(u)
    seen.set(key, (seen.get(key) ?? 0) + 1)
  }
  return [...seen.entries()].filter(([, n]) => n > 1).map(([u]) => u)
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '').toLowerCase()
}

function toRepoOutcome(result: RepoLoadResult): RepoLoadOutcome {
  if (result.status === 'ok') return { url: result.url, status: 'ok' }
  if (result.status === 'stale') return { url: result.url, status: 'stale', reason: result.reason }
  return { url: result.url, status: 'failed', reason: result.reason }
}

async function loadOneRepo(
  fetchFn: FetchFn,
  cache: CatalogCache,
  repoUrl: string,
  token: string | null
): Promise<RepoLoadResult> {
  const fresh = await fetchOneRepo(fetchFn, repoUrl, token)
  if (fresh.status === 'ok') {
    await cache.writeRepo(repoUrl, fresh.catalog)
    return fresh
  }
  const cached = await cache.readRepo(repoUrl)
  if (cached) {
    return { status: 'stale', url: repoUrl, catalog: cached, reason: fresh.reason }
  }
  return fresh
}

async function fetchOneRepo(
  fetchFn: FetchFn,
  repoUrl: string,
  token: string | null
): Promise<RepoLoadOk | RepoLoadFailed> {
  const sourceUrl = trimSlash(repoUrl)
  const apiBase = toConanApiBase(sourceUrl)
  try {
    const refs = await listRefs(fetchFn, apiBase, token)
    const components = await Promise.all(refs.map((ref) => fetchComponent(fetchFn, apiBase, ref, sourceUrl, token)))
    const catalog: CatalogDocument = { components }
    return { status: 'ok', url: repoUrl, catalog }
  } catch (err) {
    return { status: 'failed', url: repoUrl, reason: err instanceof Error ? err.message : String(err) }
  }
}

type ConanRef = { name: string; version: string; user: string; channel: string; raw: string }

async function listRefs(fetchFn: FetchFn, apiBase: string, token: string | null): Promise<ConanRef[]> {
  const url = `${apiBase}/v2/conans/search?q=*`
  const resp = await request(fetchFn, url, token)
  if (!resp.ok) {
    throw new Error(describeHttpFailure('catalog list', resp, token, url))
  }
  const parsed = SearchResponseZ.parse(await resp.json())
  return parsed.results.map(parseRef)
}

function parseRef(ref: string): ConanRef {
  const match = /^([^/]+)\/([^@]+)@([^/]+)\/(.+)$/.exec(ref)
  if (!match) throw new Error(`invalid Conan ref: ${ref}`)
  const [, name, version, user, channel] = match
  return { name, version, user, channel, raw: ref }
}

async function fetchComponent(
  fetchFn: FetchFn,
  apiBase: string,
  ref: ConanRef,
  sourceUrl: string,
  token: string | null
): Promise<CatalogComponent> {
  const recipePath = `v2/conans/${ref.name}/${ref.version}/${ref.user}/${ref.channel}`
  const revisionsUrl = `${apiBase}/${recipePath}/revisions`
  const revisionsResp = await request(fetchFn, revisionsUrl, token)
  if (!revisionsResp.ok) {
    throw new Error(describeHttpFailure(ref.raw, revisionsResp, token, revisionsUrl))
  }
  const { revisions } = RevisionsResponseZ.parse(await revisionsResp.json())
  const revision = pickLatestRevision(revisions)

  const tgzUrl = `${apiBase}/${recipePath}/revisions/${revision}/files/${EXPORT_TARBALL}`
  const tgzResp = await request(fetchFn, tgzUrl, token)
  if (!tgzResp.ok) {
    throw new Error(describeHttpFailure(ref.raw, tgzResp, token, tgzUrl))
  }
  const tgzBuffer = Buffer.from(await tgzResp.arrayBuffer())
  const fileBytes = extractFileFromTgz(tgzBuffer, METADATA_FILENAME)
  if (!fileBytes) {
    throw new Error(`${ref.raw}: ${METADATA_FILENAME} not found inside ${EXPORT_TARBALL} at ${tgzUrl}`)
  }
  return CatalogComponentZ.parse({ ...JSON.parse(fileBytes.toString('utf8')), source: sourceUrl })
}

function pickLatestRevision(revisions: ReadonlyArray<{ revision: string; time?: string }>): string {
  const timed = revisions.filter((r): r is { revision: string; time: string } => typeof r.time === 'string')
  if (timed.length > 0) {
    return [...timed].sort((a, b) => b.time.localeCompare(a.time))[0].revision
  }
  return revisions[revisions.length - 1].revision
}

function extractFileFromTgz(tgzBuffer: Buffer, filename: string): Buffer | null {
  const tar = gunzipSync(tgzBuffer)
  let offset = 0
  while (offset + 512 <= tar.length) {
    const name = tar
      .subarray(offset, offset + 100)
      .toString('utf8')
      .replace(/\0.*$/, '')
    if (!name) break
    const sizeOctal = tar
      .subarray(offset + 124, offset + 136)
      .toString('utf8')
      .replace(/\0/g, '')
      .trim()
    const size = parseInt(sizeOctal, 8)
    if (!Number.isFinite(size)) break
    const baseName = name.split('/').pop() ?? ''
    if (baseName === filename) {
      return Buffer.from(tar.subarray(offset + 512, offset + 512 + size))
    }
    offset += 512 + Math.ceil(size / 512) * 512
  }
  return null
}

function describeHttpFailure(label: string, resp: Response, token: string | null, url: string): string {
  if (resp.status === 401 || resp.status === 403) {
    const hint = token ? 'token rejected or expired' : 'token missing'
    return `${label}: HTTP ${resp.status} at ${url} - ${hint}`
  }
  return `${label}: HTTP ${resp.status} ${resp.statusText} at ${url}`
}

function request(fetchFn: FetchFn, url: string, token: string | null): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return fetchFn(url, { headers })
}

function trimSlash(s: string): string {
  return s.replace(/\/+$/, '')
}

function toConanApiBase(repoUrl: string): string {
  if (repoUrl.includes('/api/conan/')) return repoUrl
  const lastSlash = repoUrl.lastIndexOf('/')
  if (lastSlash === -1) return repoUrl
  const base = repoUrl.substring(0, lastSlash)
  const repo = repoUrl.substring(lastSlash + 1)
  return `${base}/api/conan/${repo}`
}

export { createArtifactoryCatalogSource }
