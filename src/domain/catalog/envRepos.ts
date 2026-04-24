const REPOS_VAR = 'DF_ARTIFACTORY_REPOS'
const TOKEN_VAR = 'DF_ARTIFACTORY_TOKEN'

type RepoConfig = {
  url: string
  slug: string
}

type EnvConfig =
  | { status: 'unconfigured'; missing: string[] }
  | { status: 'configured'; repos: RepoConfig[]; token: string | null }
  | { status: 'invalid'; message: string }

function slugify(url: string): string {
  return url
    .replace(/\/+$/, '')
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function parseEnv(env: Record<string, string | undefined>): EnvConfig {
  const raw = env[REPOS_VAR]?.trim()
  if (!raw) return { status: 'unconfigured', missing: [REPOS_VAR] }

  const urls = raw
    .split(',')
    .map((u) => u.trim())
    .filter((u) => u.length > 0)

  if (urls.length === 0) return { status: 'unconfigured', missing: [REPOS_VAR] }

  const repos: RepoConfig[] = urls.map((url) => ({ url, slug: slugify(url) }))

  const duplicates = findDuplicateSlugs(repos)
  if (duplicates.length > 0) {
    return {
      status: 'invalid',
      message: `Repository URLs collide to the same slug: ${duplicates.join(', ')}. Make URLs distinct.`
    }
  }

  const token = env[TOKEN_VAR]?.trim() || null
  return { status: 'configured', repos, token }
}

function findDuplicateSlugs(repos: RepoConfig[]): string[] {
  const seen = new Map<string, number>()
  for (const r of repos) seen.set(r.slug, (seen.get(r.slug) ?? 0) + 1)
  return [...seen.entries()].filter(([, n]) => n > 1).map(([slug]) => slug)
}

export { parseEnv, slugify, REPOS_VAR, TOKEN_VAR }
export type { EnvConfig, RepoConfig }
