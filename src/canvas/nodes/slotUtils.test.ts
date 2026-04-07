import { describe, it, expect } from 'vitest'
import { getSlotTooltip } from './slotUtils'

describe('getSlotTooltip', () => {
  it('returns empty string when slot has no sources', () => {
    expect(getSlotTooltip({}, 'transport')).toBe('')
  })

  it('returns empty string when sources array is empty', () => {
    expect(getSlotTooltip({ transport: [] }, 'transport')).toBe('')
  })

  it('returns single source name', () => {
    expect(getSlotTooltip({ transport: ['linkEth0'] }, 'transport')).toBe('linkEth0')
  })

  it('joins multiple sources with comma', () => {
    const map = { transport: ['linkEth0', 'linkGsm0'] }
    expect(getSlotTooltip(map, 'transport')).toBe('linkEth0, linkGsm0')
  })

  it('returns empty string for unrelated slot name', () => {
    const map = { transport: ['linkEth0'] }
    expect(getSlotTooltip(map, 'other')).toBe('')
  })
})
