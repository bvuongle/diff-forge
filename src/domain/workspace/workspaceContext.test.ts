import { describe, expect, it } from 'vitest'

import { checkWorkspace, getProjectName } from './workspaceContext'

describe('getProjectName', () => {
  it('returns last path segment', () => {
    expect(getProjectName('/Users/alice/Developer/diff-forge')).toBe('diff-forge')
  })

  it('strips trailing slash', () => {
    expect(getProjectName('/Users/alice/Developer/diff-forge/')).toBe('diff-forge')
  })

  it('returns empty for root', () => {
    expect(getProjectName('/')).toBe('')
  })
})

describe('checkWorkspace', () => {
  const home = '/Users/alice'

  it('accepts a normal project directory', () => {
    const status = checkWorkspace('/Users/alice/Developer/diff-forge', home)
    expect(status).toEqual({
      valid: true,
      projectName: 'diff-forge',
      cwd: '/Users/alice/Developer/diff-forge'
    })
  })

  it('rejects filesystem root', () => {
    const status = checkWorkspace('/', home)
    expect(status.valid).toBe(false)
    if (!status.valid) expect(status.reason).toBe('root')
  })

  it('rejects home directory exact match', () => {
    const status = checkWorkspace('/Users/alice', home)
    expect(status.valid).toBe(false)
    if (!status.valid) expect(status.reason).toBe('home')
  })

  it('rejects home directory with trailing slash', () => {
    const status = checkWorkspace('/Users/alice/', home)
    expect(status.valid).toBe(false)
    if (!status.valid) expect(status.reason).toBe('home')
  })

  it('rejects empty cwd', () => {
    const status = checkWorkspace('', home)
    expect(status.valid).toBe(false)
    if (!status.valid) expect(status.reason).toBe('empty')
  })

  it('accepts a subdirectory of home', () => {
    const status = checkWorkspace('/Users/alice/projects/app', home)
    expect(status.valid).toBe(true)
    if (status.valid) expect(status.projectName).toBe('app')
  })
})
