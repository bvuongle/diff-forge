import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '@state/uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      searchQuery: '',
      expandedNodeIds: new Set(),
      dragInfo: null,
      nodeWidths: {}
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

  describe('dragInfo', () => {
    it('starts null', () => {
      expect(useUIStore.getState().dragInfo).toBeNull()
    })

    it('setDragInfo sets drag info', () => {
      useUIStore.getState().setDragInfo({ sourceNodeId: 'n1', sourceInterfaces: ['ILink'] })
      expect(useUIStore.getState().dragInfo).toEqual({
        sourceNodeId: 'n1',
        sourceInterfaces: ['ILink']
      })
    })

    it('setDragInfo(null) clears drag info', () => {
      useUIStore.getState().setDragInfo({ sourceNodeId: 'n1', sourceInterfaces: ['ILink'] })
      useUIStore.getState().setDragInfo(null)
      expect(useUIStore.getState().dragInfo).toBeNull()
    })
  })

  describe('nodeWidths', () => {
    it('starts empty', () => {
      expect(useUIStore.getState().nodeWidths).toEqual({})
    })

    it('setNodeWidth records width for a node', () => {
      useUIStore.getState().setNodeWidth('n1', 240)
      expect(useUIStore.getState().nodeWidths['n1']).toBe(240)
    })

    it('setNodeWidth does not create new state if width unchanged', () => {
      useUIStore.getState().setNodeWidth('n1', 240)
      const before = useUIStore.getState()
      useUIStore.getState().setNodeWidth('n1', 240)
      const after = useUIStore.getState()
      // Zustand returns same state reference when setter returns current state
      expect(before.nodeWidths).toBe(after.nodeWidths)
    })

    it('setNodeWidth updates width for an existing node', () => {
      useUIStore.getState().setNodeWidth('n1', 240)
      useUIStore.getState().setNodeWidth('n1', 340)
      expect(useUIStore.getState().nodeWidths['n1']).toBe(340)
    })
  })
})
