import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAppHotkeys } from '@layout/useAppHotkeys'

const exportMock = vi.fn()
const switchMock = vi.fn()

vi.mock('@state/topologyCommands', () => ({
  exportTopology: () => exportMock(),
  requestWorkspaceSwitch: () => switchMock()
}))

function fireKey(opts: KeyboardEventInit & { targetElement?: HTMLElement } = {}) {
  const { targetElement, ...eventOpts } = opts
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...eventOpts })
  if (targetElement) {
    Object.defineProperty(event, 'target', { value: targetElement })
  }
  window.dispatchEvent(event)
}

describe('useAppHotkeys', () => {
  beforeEach(() => {
    exportMock.mockReset()
    switchMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Cmd/Ctrl+S triggers exportTopology', () => {
    renderHook(() => useAppHotkeys())
    act(() => fireKey({ code: 'KeyS', metaKey: true }))
    expect(exportMock).toHaveBeenCalledTimes(1)
  })

  it('Cmd/Ctrl+O triggers requestWorkspaceSwitch', () => {
    renderHook(() => useAppHotkeys())
    act(() => fireKey({ code: 'KeyO', ctrlKey: true }))
    expect(switchMock).toHaveBeenCalledTimes(1)
  })

  it('ignores bare S without modifier', () => {
    renderHook(() => useAppHotkeys())
    act(() => fireKey({ code: 'KeyS' }))
    expect(exportMock).not.toHaveBeenCalled()
  })

  it('ignores hotkeys while focus is in a text field', () => {
    renderHook(() => useAppHotkeys())
    const input = document.createElement('input')
    act(() => fireKey({ code: 'KeyS', metaKey: true, targetElement: input }))
    expect(exportMock).not.toHaveBeenCalled()
  })
})
