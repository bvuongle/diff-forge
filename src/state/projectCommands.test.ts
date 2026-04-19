import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useGraphStore } from '@state/graphStore'
import { useNotificationsStore } from '@state/notificationsStore'
import { exportTopology, performWorkspaceSwitch, requestWorkspaceSwitch } from '@state/projectCommands'
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
      catalog: { load: vi.fn() },
      workspace: { status: vi.fn(), openAtPath: vi.fn() },
      dialog: { openWorkspace: openWorkspaceMock },
      project: { export: exportMock, load: vi.fn() }
    }
  })
  useGraphStore.setState({
    graph: { nodes: [], edges: [] },
    dirty: false,
    selectedNodeIds: new Set(),
    selectedEdgeIds: new Set()
  })
  useWorkspaceStore.setState({
    status: { valid: true, projectName: 'demo', cwd: '/Users/dev/demo' }
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
      projectName: 'demo'
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
})

describe('performWorkspaceSwitch', () => {
  it('updates workspace store on opened', async () => {
    openWorkspaceMock.mockResolvedValue({
      status: 'opened',
      workspace: { valid: true, projectName: 'next', cwd: '/next' }
    })
    await performWorkspaceSwitch()
    expect(useWorkspaceStore.getState().status).toEqual({
      valid: true,
      projectName: 'next',
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
  it('opens picker directly when graph is clean', () => {
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
