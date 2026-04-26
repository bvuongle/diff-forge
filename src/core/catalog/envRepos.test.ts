import { describe, expect, it } from 'vitest'

import { parseEnv } from './envRepos'

describe('parseEnv', () => {
  it('returns unconfigured when DF_ARTIFACTORY_REPOS is missing', () => {
    expect(parseEnv({})).toEqual({ status: 'unconfigured', missing: ['DF_ARTIFACTORY_REPOS'] })
  })

  it('returns unconfigured when DF_ARTIFACTORY_REPOS is empty or whitespace', () => {
    expect(parseEnv({ DF_ARTIFACTORY_REPOS: '   ' })).toMatchObject({ status: 'unconfigured' })
    expect(parseEnv({ DF_ARTIFACTORY_REPOS: ',,  ,' })).toMatchObject({ status: 'unconfigured' })
  })

  it('parses a single repo URL', () => {
    const result = parseEnv({ DF_ARTIFACTORY_REPOS: 'https://a.example/conan' })
    expect(result.status).toBe('configured')
    if (result.status !== 'configured') return
    expect(result.repos).toEqual([{ url: 'https://a.example/conan' }])
    expect(result.token).toBeNull()
  })

  it('parses comma-separated repos and trims whitespace', () => {
    const result = parseEnv({
      DF_ARTIFACTORY_REPOS: 'https://a.example/conan , https://b.example/artifactory/x '
    })
    if (result.status !== 'configured') throw new Error('expected configured')
    expect(result.repos.map((r) => r.url)).toEqual(['https://a.example/conan', 'https://b.example/artifactory/x'])
  })

  it('includes the token when DF_ARTIFACTORY_TOKEN is set', () => {
    const result = parseEnv({
      DF_ARTIFACTORY_REPOS: 'https://a.example/conan',
      DF_ARTIFACTORY_TOKEN: 'secret-123'
    })
    if (result.status !== 'configured') throw new Error('expected configured')
    expect(result.token).toBe('secret-123')
  })

  it('flags duplicate URLs as invalid (ignoring trailing slash and case)', () => {
    const result = parseEnv({
      DF_ARTIFACTORY_REPOS: 'https://a.example/conan/,https://A.example/conan'
    })
    expect(result.status).toBe('invalid')
  })
})
