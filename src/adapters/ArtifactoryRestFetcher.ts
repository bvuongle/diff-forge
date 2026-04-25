import { gunzipSync } from 'node:zlib'

import { z } from 'zod'

import type { CatalogComponent, CatalogDocument } from '@domain/catalog/CatalogSchema'
import { ComponentFragmentZ, fragmentToComponent } from '@domain/catalog/CatalogWireSchema'
import type { CatalogRepoFetcher, RepoFetchResult } from '@contracts/CatalogRepoFetcher'

type FetchFn = typeof fetch

type Deps = { fetch: FetchFn }

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

const METADATA_FILENAME = 'diff.metadata.json'
const EXPORT_TARBALL = 'conan_export.tgz'

function createArtifactoryRestFetcher(deps: Deps): CatalogRepoFetcher {
  return {
    async fetch(repo, token) {
      const sourceUrl = trimSlash(repo.url)
      const apiBase = toConanApiBase(sourceUrl)
      try {
        const refs = await listRefs(deps.fetch, apiBase, token)
        const components = await Promise.all(
          refs.map((ref) => fetchComponent(deps.fetch, apiBase, ref, sourceUrl, token))
        )
        const catalog: CatalogDocument = { schema: 'diff.catalog.v1', components }
        return { status: 'ok', url: repo.url, catalog }
      } catch (err) {
        return failed(repo, err instanceof Error ? err.message : String(err))
      }
    }
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
  const fragment = ComponentFragmentZ.parse(JSON.parse(fileBytes.toString('utf8')))
  return fragmentToComponent(fragment, sourceUrl)
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

function failed(repo: { url: string }, reason: string): Extract<RepoFetchResult, { status: 'failed' }> {
  return { status: 'failed', url: repo.url, reason }
}

export { createArtifactoryRestFetcher }
