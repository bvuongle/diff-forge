import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAppHotkeys } from '@layout/useAppHotkeys'

const exportMock = vi.fn()
const switchMock = vi.fn()

vi.mock('@state/projectCommands', () => ({
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

  it('Cmd+S triggers exportTopology', () => {
    renderHook(() => useAppHotkeys())
    act(() => {
      fireKey({ code: 'KeyS', metaKey: true })
    })
    expect(exportMock).toHaveBeenCalledTimes(1)
  })

  it('Ctrl+S triggers exportTopology', () => {
    renderHook(() => useAppHotkeys())
    act(() => {
      fireKey({ code: 'KeyS', ctrlKey: true })
    })
    expect(exportMock).toHaveBeenCalledTimes(1)
  })

  it('Cmd+O triggers requestWorkspaceSwitch', () => {
    renderHook(() => useAppHotkeys())
    act(() => {
      fireKey({ code: 'KeyO', metaKey: true })
    })
    expect(switchMock).toHaveBeenCalledTimes(1)
  })

  it('S without modifier does nothing', () => {
    renderHook(() => useAppHotkeys())
    act(() => {
      fireKey({ code: 'KeyS' })
    })
    expect(exportMock).not.toHaveBeenCalled()
  })

  it('ignores Cmd+S inside an INPUT element', () => {
    renderHook(() => useAppHotkeys())
    const input = document.createElement('input')
    act(() => {
      fireKey({ code: 'KeyS', metaKey: true, targetElement: input })
    })
    expect(exportMock).not.toHaveBeenCalled()
  })

  it('ignores Cmd+O inside a TEXTAREA element', () => {
    renderHook(() => useAppHotkeys())
    const textarea = document.createElement('textarea')
    act(() => {
      fireKey({ code: 'KeyO', metaKey: true, targetElement: textarea })
    })
    expect(switchMock).not.toHaveBeenCalled()
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useAppHotkeys())
    unmount()
    act(() => {
      fireKey({ code: 'KeyS', metaKey: true })
    })
    expect(exportMock).not.toHaveBeenCalled()
  })
})
