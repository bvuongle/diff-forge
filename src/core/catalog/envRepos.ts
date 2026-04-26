const REPOS_VAR = 'DF_ARTIFACTORY_REPOS'
const TOKEN_VAR = 'DF_ARTIFACTORY_TOKEN'

type RepoConfig = {
  url: string
}

type EnvConfig =
  | { status: 'unconfigured'; missing: string[] }
  | { status: 'configured'; repos: RepoConfig[]; token: string | null }
  | { status: 'invalid'; message: string }

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '').toLowerCase()
}

function parseEnv(env: Record<string, string | undefined>): EnvConfig {
  const raw = env[REPOS_VAR]?.trim()
  if (!raw) return { status: 'unconfigured', missing: [REPOS_VAR] }

  const urls = raw
    .split(',')
    .map((u) => u.trim())
    .filter((u) => u.length > 0)

  if (urls.length === 0) return { status: 'unconfigured', missing: [REPOS_VAR] }

  const duplicates = findDuplicateUrls(urls)
  if (duplicates.length > 0) {
    return {
      status: 'invalid',
      message: `Duplicate repository URLs: ${duplicates.join(', ')}. Each URL must be distinct.`
    }
  }

  const repos: RepoConfig[] = urls.map((url) => ({ url }))
  const token = env[TOKEN_VAR]?.trim() || null
  return { status: 'configured', repos, token }
}

function findDuplicateUrls(urls: string[]): string[] {
  const seen = new Map<string, number>()
  for (const u of urls) {
    const key = normalizeUrl(u)
    seen.set(key, (seen.get(key) ?? 0) + 1)
  }
  return [...seen.entries()].filter(([, n]) => n > 1).map(([u]) => u)
}

export { parseEnv, REPOS_VAR, TOKEN_VAR }
export type { EnvConfig, RepoConfig }
