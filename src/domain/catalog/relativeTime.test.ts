import { describe, expect, it } from 'vitest'

import { relativeTime } from './relativeTime'

const now = new Date('2026-04-24T12:00:00Z')

describe('relativeTime', () => {
  it('returns "just now" for under 45 seconds', () => {
    expect(relativeTime('2026-04-24T11:59:30Z', now)).toBe('just now')
  })

  it('returns minutes for up to an hour', () => {
    expect(relativeTime('2026-04-24T11:55:00Z', now)).toBe('5m ago')
  })

  it('returns hours for under a day', () => {
    expect(relativeTime('2026-04-24T09:00:00Z', now)).toBe('3h ago')
  })

  it('returns days past 24 hours', () => {
    expect(relativeTime('2026-04-22T12:00:00Z', now)).toBe('2d ago')
  })

  it('clamps future timestamps to "just now"', () => {
    expect(relativeTime('2026-04-24T12:05:00Z', now)).toBe('just now')
  })

  it('returns "unknown" for malformed input', () => {
    expect(relativeTime('not-a-date', now)).toBe('unknown')
  })
})
