import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useGraphStore } from '@state/graphStore'
import { useNotificationsStore } from '@state/notificationsStore'
import { exportTopology, performWorkspaceSwitch, requestWorkspaceSwitch } from '@state/topologyCommands'
import { useUIStore } from '@state/uiStore'
import { useWorkspaceStore } from '@state/workspaceStore'

const exportMock = vi.fn()
const openWorkspaceMock = vi.fn()

beforeEach(() => {
  exportMock.mockReset()
  openWorkspaceMock.mockReset()
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: {
      workspace: { status: vi.fn(), openAtPath: vi.fn() },
      dialog: { openWorkspace: openWorkspaceMock },
      topology: { export: exportMock, load: vi.fn() }
    }
  })
  useGraphStore.setState({
    graph: { nodes: [], edges: [] },
    dirty: false,
    selectedNodeIds: new Set(),
    selectedEdgeIds: new Set()
  })
  useWorkspaceStore.setState({
    status: { valid: true, name: 'demo', cwd: '/Users/dev/demo' }
  })
  useNotificationsStore.setState({ notifications: [] })
  useUIStore.setState({ switchConfirmOpen: false })
})

afterEach(() => {
  delete (window as unknown as { electronAPI?: unknown }).electronAPI
})

describe('exportTopology', () => {
  it('writes graph and notifies on success, clears dirty', async () => {
    useGraphStore.setState({ dirty: true })
    exportMock.mockResolvedValue({
      status: 'saved',
      topologyPath: '/Users/dev/demo/demo.forge.json',
      name: 'demo'
    })
    await exportTopology()
    expect(exportMock).toHaveBeenCalledTimes(1)
    expect(useGraphStore.getState().dirty).toBe(false)
    const last = useNotificationsStore.getState().notifications.at(-1)
    expect(last?.severity).toBe('success')
    expect(last?.message).toMatch(/demo\.forge\.json/)
  })

  it('blocks and notifies when no workspace is open', async () => {
    useWorkspaceStore.setState({ status: { valid: false, reason: 'empty', cwd: '' } })
    await exportTopology()
    expect(exportMock).not.toHaveBeenCalled()
    const last = useNotificationsStore.getState().notifications.at(-1)
    expect(last?.severity).toBe('error')
    expect(last?.message).toMatch(/open a workspace/i)
  })

  it('emits error notification when adapter reports failure', async () => {
    exportMock.mockResolvedValue({ status: 'error', message: 'disk full' })
    await exportTopology()
    const last = useNotificationsStore.getState().notifications.at(-1)
    expect(last?.severity).toBe('error')
    expect(last?.message).toMatch(/disk full/)
  })

  it('blocks export and reports cycle members when a cycle exists', async () => {
    useGraphStore.setState({
      graph: {
        nodes: [
          {
            id: 'a',
            instanceId: 'a',
            componentType: 'X',
            source: 's',
            version: '1',
            position: { x: 0, y: 0 },
            configData: {},
            slots: []
          },
          {
            id: 'b',
            instanceId: 'b',
            componentType: 'X',
            source: 's',
            version: '1',
            position: { x: 0, y: 0 },
            configData: {},
            slots: []
          }
        ],
        edges: [
          { id: 'e1', sourceNodeId: 'a', sourceSlot: 'o', targetNodeId: 'b', targetSlot: 'i' },
          { id: 'e2', sourceNodeId: 'b', sourceSlot: 'o', targetNodeId: 'a', targetSlot: 'i' }
        ]
      }
    })
    await exportTopology()
    expect(exportMock).not.toHaveBeenCalled()
    const last = useNotificationsStore.getState().notifications.at(-1)
    expect(last?.severity).toBe('error')
    expect(typeof last?.message).toBe('object')
    const msg = last?.message as { title: string; items: string[] }
    expect(msg.title).toMatch(/cannot export/i)
    expect(msg.items.some((i) => /cycle/i.test(i))).toBe(true)
    const flagged = useGraphStore.getState().flaggedNodeIds
    expect(flagged.has('a')).toBe(true)
    expect(flagged.has('b')).toBe(true)
  })

  it('blocks export and lists unfilled required slots', async () => {
    useGraphStore.setState({
      graph: {
        nodes: [
          {
            id: 'msg-uuid',
            instanceId: 'messageSource0',
            componentType: 'MessageSource',
            source: 's',
            version: '1',
            position: { x: 0, y: 0 },
            configData: {},
            slots: [{ name: 'link', type: 'ILink', direction: 'in', isArray: false }]
          }
        ],
        edges: []
      }
    })
    await exportTopology()
    expect(exportMock).not.toHaveBeenCalled()
    const last = useNotificationsStore.getState().notifications.at(-1)
    expect(last?.severity).toBe('error')
    const msg = last?.message as { title: string; items: string[] }
    expect(msg.items.some((i) => i.includes('messageSource0.link'))).toBe(true)
    expect(useGraphStore.getState().flaggedNodeIds.has('msg-uuid')).toBe(true)
  })

  it('proceeds to write when graph is valid (no cycles, all required slots wired)', async () => {
    exportMock.mockResolvedValue({
      status: 'saved',
      topologyPath: '/Users/dev/demo/demo.forge.json',
      name: 'demo'
    })
    useGraphStore.setState({
      graph: {
        nodes: [
          {
            id: 'src',
            instanceId: 'linkEth0',
            componentType: 'LinkEth',
            source: 's',
            version: '1',
            position: { x: 0, y: 0 },
            configData: {},
            slots: [{ name: 'ILink', type: 'ILink', direction: 'out', isArray: true }]
          },
          {
            id: 'tgt',
            instanceId: 'messageSource0',
            componentType: 'MessageSource',
            source: 's',
            version: '1',
            position: { x: 0, y: 0 },
            configData: {},
            slots: [{ name: 'link', type: 'ILink', direction: 'in', isArray: false }]
          }
        ],
        edges: [{ id: 'e1', sourceNodeId: 'src', sourceSlot: 'ILink', targetNodeId: 'tgt', targetSlot: 'link' }]
      }
    })
    useGraphStore.setState({ flaggedNodeIds: new Set(['stale-id']) })
    await exportTopology()
    expect(exportMock).toHaveBeenCalledTimes(1)
    expect(useGraphStore.getState().flaggedNodeIds.size).toBe(0)
  })
})

describe('performWorkspaceSwitch', () => {
  it('updates workspace store on opened', async () => {
    openWorkspaceMock.mockResolvedValue({
      status: 'opened',
      workspace: { valid: true, name: 'next', cwd: '/next' }
    })
    await performWorkspaceSwitch()
    expect(useWorkspaceStore.getState().status).toEqual({
      valid: true,
      name: 'next',
      cwd: '/next'
    })
  })

  it('notifies on adapter error', async () => {
    openWorkspaceMock.mockResolvedValue({ status: 'error', message: 'permission denied' })
    await performWorkspaceSwitch()
    const last = useNotificationsStore.getState().notifications.at(-1)
    expect(last?.severity).toBe('error')
    expect(last?.message).toMatch(/permission denied/)
  })
})

describe('requestWorkspaceSwitch', () => {
  it('opens the workspace selector directly when graph is clean', () => {
    openWorkspaceMock.mockResolvedValue({ status: 'canceled' })
    requestWorkspaceSwitch()
    expect(useUIStore.getState().switchConfirmOpen).toBe(false)
    expect(openWorkspaceMock).toHaveBeenCalledTimes(1)
  })

  it('opens confirmation dialog when graph is dirty', () => {
    useGraphStore.setState({ dirty: true })
    requestWorkspaceSwitch()
    expect(useUIStore.getState().switchConfirmOpen).toBe(true)
    expect(openWorkspaceMock).not.toHaveBeenCalled()
  })
})
