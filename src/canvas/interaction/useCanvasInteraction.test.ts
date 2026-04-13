import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCanvasInteraction } from './useCanvasInteraction'
import { makeNode } from '@testing/fixtures'

function makeCanvasRef() {
  const div = document.createElement('div')
  Object.defineProperty(div, 'getBoundingClientRect', {
    value: () => ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 })
  })
  return { current: div }
}

describe('useCanvasInteraction', () => {
  let canvasRef: React.RefObject<HTMLDivElement | null>

  beforeEach(() => {
    canvasRef = makeCanvasRef()
  })

  it('initializes with default transform', () => {
    const { result } = renderHook(() => useCanvasInteraction(canvasRef))
    expect(result.current.transform).toEqual({ zoom: 1, panX: 0, panY: 0 })
  })

  describe('keyboard zoom', () => {
    it('zooms in with Ctrl+=', () => {
      const { result } = renderHook(() => useCanvasInteraction(canvasRef))
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '=', ctrlKey: true }))
      })
      expect(result.current.transform.zoom).toBeCloseTo(1.1, 5)
    })

    it('zooms out with Ctrl+-', () => {
      const { result } = renderHook(() => useCanvasInteraction(canvasRef))
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '-', ctrlKey: true }))
      })
      expect(result.current.transform.zoom).toBeCloseTo(0.9, 5)
    })

    it('resets to 1 with Ctrl+0', () => {
      const { result } = renderHook(() => useCanvasInteraction(canvasRef))
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '=', ctrlKey: true }))
      })
      expect(result.current.transform.zoom).not.toBe(1)
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '0', ctrlKey: true }))
      })
      expect(result.current.transform).toEqual({ zoom: 1, panX: 0, panY: 0 })
    })

    it('does not zoom without modifier key', () => {
      const { result } = renderHook(() => useCanvasInteraction(canvasRef))
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '=', ctrlKey: false }))
      })
      expect(result.current.transform.zoom).toBe(1)
    })

    it('zooms in with Ctrl++', () => {
      const { result } = renderHook(() => useCanvasInteraction(canvasRef))
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '+', ctrlKey: true }))
      })
      expect(result.current.transform.zoom).toBeCloseTo(1.1, 5)
    })

    it('zooms in with metaKey (Cmd)', () => {
      const { result } = renderHook(() => useCanvasInteraction(canvasRef))
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '=', metaKey: true }))
      })
      expect(result.current.transform.zoom).toBeCloseTo(1.1, 5)
    })
  })

  describe('zoom clamping', () => {
    it('clamps zoom to MAX_ZOOM (3)', () => {
      const { result } = renderHook(() => useCanvasInteraction(canvasRef))
      for (let i = 0; i < 30; i++) {
        act(() => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: '=', ctrlKey: true }))
        })
      }
      expect(result.current.transform.zoom).toBe(3)
    })

    it('clamps zoom to MIN_ZOOM (0.25)', () => {
      const { result } = renderHook(() => useCanvasInteraction(canvasRef))
      for (let i = 0; i < 20; i++) {
        act(() => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: '-', ctrlKey: true }))
        })
      }
      expect(result.current.transform.zoom).toBe(0.25)
    })
  })

  describe('fitToView', () => {
    it('resets to default when no nodes', () => {
      const { result } = renderHook(() => useCanvasInteraction(canvasRef))
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '=', ctrlKey: true }))
      })
      act(() => {
        result.current.fitToView([], 800, 600)
      })
      expect(result.current.transform).toEqual({ zoom: 1, panX: 0, panY: 0 })
    })

    it('calculates transform for a single node', () => {
      const { result } = renderHook(() => useCanvasInteraction(canvasRef))
      const nodes = [makeNode('n1', { position: { x: 100, y: 100 } })]
      act(() => {
        result.current.fitToView(nodes, 800, 600)
      })
      expect(result.current.transform.zoom).toBeLessThanOrEqual(1.5)
      expect(result.current.transform.zoom).toBeGreaterThanOrEqual(0.25)
    })

    it('handles widely spread nodes', () => {
      const { result } = renderHook(() => useCanvasInteraction(canvasRef))
      const nodes = [
        makeNode('n1', { position: { x: 0, y: 0 } }),
        makeNode('n2', { position: { x: 2000, y: 2000 } })
      ]
      act(() => {
        result.current.fitToView(nodes, 800, 600)
      })
      expect(result.current.transform.zoom).toBeLessThan(1)
      expect(result.current.transform.zoom).toBeGreaterThanOrEqual(0.25)
    })

    it('handles nodes clustered together in small area', () => {
      const { result } = renderHook(() => useCanvasInteraction(canvasRef))
      const nodes = [
        makeNode('n1', { position: { x: 100, y: 100 } }),
        makeNode('n2', { position: { x: 120, y: 120 } })
      ]
      act(() => {
        result.current.fitToView(nodes, 800, 600)
      })
      expect(result.current.transform.zoom).toBe(1.5)
    })
  })

  describe('resetView', () => {
    it('resets zoom and pan to defaults', () => {
      const { result } = renderHook(() => useCanvasInteraction(canvasRef))
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '=', ctrlKey: true }))
      })
      expect(result.current.transform.zoom).toBeCloseTo(1.1)
      act(() => {
        result.current.resetView()
      })
      expect(result.current.transform).toEqual({ zoom: 1, panX: 0, panY: 0 })
    })
  })
})
