import { beforeEach, describe, expect, it } from 'vitest'

import { useUIStore } from '@state/uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      searchQuery: '',
      searchMode: 'name',
      expandedNodeIds: new Set(),
      canvasMode: 'select',
      snapToGrid: false,
      animateEdges: false
    })
  })

  describe('searchQuery', () => {
    it('starts empty', () => {
      expect(useUIStore.getState().searchQuery).toBe('')
    })

    it('setSearchQuery updates the query', () => {
      useUIStore.getState().setSearchQuery('Link')
      expect(useUIStore.getState().searchQuery).toBe('Link')
    })
  })

  describe('searchMode', () => {
    it('defaults to name', () => {
      expect(useUIStore.getState().searchMode).toBe('name')
    })

    it('setSearchMode switches to interface', () => {
      useUIStore.getState().setSearchMode('interface')
      expect(useUIStore.getState().searchMode).toBe('interface')
    })
  })

  describe('expandedNodeIds', () => {
    it('starts empty', () => {
      expect(useUIStore.getState().expandedNodeIds.size).toBe(0)
    })

    it('toggleNodeExpanded adds a node id', () => {
      useUIStore.getState().toggleNodeExpanded('n1')
      expect(useUIStore.getState().expandedNodeIds.has('n1')).toBe(true)
    })

    it('toggleNodeExpanded removes an already-expanded node id', () => {
      useUIStore.getState().toggleNodeExpanded('n1')
      useUIStore.getState().toggleNodeExpanded('n1')
      expect(useUIStore.getState().expandedNodeIds.has('n1')).toBe(false)
    })

    it('expandAll sets all provided ids', () => {
      useUIStore.getState().expandAll(['n1', 'n2', 'n3'])
      const ids = useUIStore.getState().expandedNodeIds
      expect(ids.size).toBe(3)
      expect(ids.has('n1')).toBe(true)
      expect(ids.has('n2')).toBe(true)
      expect(ids.has('n3')).toBe(true)
    })

    it('collapseAll clears all expanded ids', () => {
      useUIStore.getState().expandAll(['n1', 'n2'])
      useUIStore.getState().collapseAll()
      expect(useUIStore.getState().expandedNodeIds.size).toBe(0)
    })
  })

  describe('canvasMode', () => {
    it('defaults to select', () => {
      expect(useUIStore.getState().canvasMode).toBe('select')
    })

    it('setCanvasMode switches to pan', () => {
      useUIStore.getState().setCanvasMode('pan')
      expect(useUIStore.getState().canvasMode).toBe('pan')
    })

    it('setCanvasMode switches back to select', () => {
      useUIStore.getState().setCanvasMode('pan')
      useUIStore.getState().setCanvasMode('select')
      expect(useUIStore.getState().canvasMode).toBe('select')
    })
  })

  describe('snapToGrid', () => {
    it('defaults to false', () => {
      expect(useUIStore.getState().snapToGrid).toBe(false)
    })

    it('toggleSnapToGrid enables snap', () => {
      useUIStore.getState().toggleSnapToGrid()
      expect(useUIStore.getState().snapToGrid).toBe(true)
    })

    it('toggleSnapToGrid toggles back to false', () => {
      useUIStore.getState().toggleSnapToGrid()
      useUIStore.getState().toggleSnapToGrid()
      expect(useUIStore.getState().snapToGrid).toBe(false)
    })
  })

  describe('animateEdges', () => {
    it('defaults to false', () => {
      expect(useUIStore.getState().animateEdges).toBe(false)
    })

    it('toggleAnimateEdges enables animation', () => {
      useUIStore.getState().toggleAnimateEdges()
      expect(useUIStore.getState().animateEdges).toBe(true)
    })

    it('toggleAnimateEdges toggles back to false', () => {
      useUIStore.getState().toggleAnimateEdges()
      useUIStore.getState().toggleAnimateEdges()
      expect(useUIStore.getState().animateEdges).toBe(false)
    })
  })
})
