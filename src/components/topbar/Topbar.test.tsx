import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCatalogStore } from '@state/catalogStore'
import { useGraphStore } from '@state/graphStore'
import { useNotificationsStore } from '@state/notificationsStore'
import { useUIStore } from '@state/uiStore'
import { useWorkspaceStore } from '@state/workspaceStore'
import { NotificationHost } from '@layout/NotificationHost'
import { makeEdge, makeNode } from '@testing/fixtures'
import { renderWithTheme } from '@testing/test-utils'

import { Topbar } from './Topbar'

function renderTopbar() {
  return renderWithTheme(
    <>
      <Topbar />
      <NotificationHost />
    </>
  )
}

const exportMock = vi.fn()
const loadMock = vi.fn()
const openWorkspaceMock = vi.fn()
const workspaceStatusMock = vi.fn()

beforeEach(() => {
  exportMock.mockReset()
  loadMock.mockReset()
  openWorkspaceMock.mockReset()
  workspaceStatusMock.mockReset()
  loadMock.mockResolvedValue({ status: 'notFound' })
  workspaceStatusMock.mockResolvedValue({
    valid: true,
    projectName: 'diff-forge',
    cwd: '/Users/dev/diff-forge'
  })
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: {
      workspace: { status: workspaceStatusMock },
      dialog: { openWorkspace: openWorkspaceMock },
      topology: { export: exportMock, load: loadMock }
    }
  })
  useGraphStore.setState({
    graph: { nodes: [], edges: [] },
    dirty: false,
    selectedNodeIds: new Set(),
    selectedEdgeIds: new Set()
  })
  useWorkspaceStore.setState({
    status: { valid: true, projectName: 'diff-forge', cwd: '/Users/dev/diff-forge' }
  })
  useCatalogStore.setState({ catalog: null, loading: false, error: null })
  useNotificationsStore.setState({ notifications: [] })
  useUIStore.setState({ switchConfirmOpen: false })
})

afterEach(() => {
  delete (window as unknown as { electronAPI?: unknown }).electronAPI
})

describe('Topbar', () => {
  it('renders title', () => {
    renderWithTheme(<Topbar />)
    expect(screen.getByText('Diff Forge')).toBeInTheDocument()
  })

  it('renders Export Topology button', () => {
    renderWithTheme(<Topbar />)
    expect(screen.getByRole('button', { name: /export topology/i })).toBeInTheDocument()
  })

  it('shows project chip when workspace valid', () => {
    renderWithTheme(<Topbar />)
    expect(screen.getByRole('button', { name: /switch workspace/i })).toHaveTextContent('diff-forge')
  })

  it('shows dirty marker on project chip when graph is dirty', () => {
    useGraphStore.setState({ dirty: true })
    renderWithTheme(<Topbar />)
    expect(screen.getByRole('button', { name: /switch workspace/i })).toHaveTextContent('diff-forge *')
  })

  it('invokes IPC with topology payload when Export clicked', async () => {
    useGraphStore.setState({
      graph: {
        nodes: [
          makeNode('n1', { instanceId: 'linkEth0', componentType: 'LinkEth' }),
          makeNode('n2', { instanceId: 'msg0', componentType: 'MessageSource', config: { count: 3 } })
        ],
        edges: [makeEdge('e1', 'n1', 'n2')]
      }
    })
    exportMock.mockResolvedValue({
      status: 'saved',
      topologyPath: '/tmp/diff-forge.forge.json',
      projectName: 'diff-forge'
    })

    renderWithTheme(<Topbar />)
    fireEvent.click(screen.getByRole('button', { name: /export topology/i }))

    await waitFor(() => expect(exportMock).toHaveBeenCalledTimes(1))
    const payload = exportMock.mock.calls[0][0]
    expect(payload).not.toHaveProperty('sidecar')
    const topology = JSON.parse(payload.topology)
    expect(topology).toHaveLength(2)
    expect(topology.find((e: { id: string }) => e.id === 'msg0')).toMatchObject({
      type: 'MessageSource',
      dependencies: ['linkEth0'],
      config: { count: 3 }
    })
  })

  it('clears dirty on successful export', async () => {
    useGraphStore.setState({ dirty: true })
    exportMock.mockResolvedValue({
      status: 'saved',
      topologyPath: '/tmp/diff-forge.forge.json',
      projectName: 'diff-forge'
    })
    renderWithTheme(<Topbar />)
    fireEvent.click(screen.getByRole('button', { name: /export topology/i }))
    await waitFor(() => expect(useGraphStore.getState().dirty).toBe(false))
  })

  it('shows success snackbar with main filename only', async () => {
    exportMock.mockResolvedValue({
      status: 'saved',
      topologyPath: '/tmp/diff-forge.forge.json',
      projectName: 'diff-forge'
    })
    renderTopbar()
    fireEvent.click(screen.getByRole('button', { name: /export topology/i }))
    expect(await screen.findByText(/wrote diff-forge\.forge\.json/i)).toBeInTheDocument()
  })

  it('shows error snackbar when export fails', async () => {
    exportMock.mockResolvedValue({ status: 'error', message: 'disk full' })
    renderTopbar()
    fireEvent.click(screen.getByRole('button', { name: /export topology/i }))
    expect(await screen.findByText(/export failed: disk full/i)).toBeInTheDocument()
  })

  it('disables export when workspace is invalid', async () => {
    useWorkspaceStore.setState({ status: { valid: false, reason: 'home', cwd: '/Users/dev' } })
    renderWithTheme(<Topbar />)
    expect(screen.getByRole('button', { name: /export topology/i })).toBeDisabled()
  })

  it('switches workspace directly when graph is clean', async () => {
    openWorkspaceMock.mockResolvedValue({
      status: 'opened',
      workspace: { valid: true, projectName: 'other', cwd: '/other' }
    })
    renderWithTheme(<Topbar />)
    fireEvent.click(screen.getByRole('button', { name: /switch workspace/i }))
    await waitFor(() => expect(openWorkspaceMock).toHaveBeenCalled())
    await waitFor(() =>
      expect(useWorkspaceStore.getState().status).toEqual({
        valid: true,
        projectName: 'other',
        cwd: '/other'
      })
    )
  })

  it('asks for confirmation before switching when graph is dirty', async () => {
    useGraphStore.setState({ dirty: true })
    renderWithTheme(<Topbar />)
    fireEvent.click(screen.getByRole('button', { name: /switch workspace/i }))
    expect(await screen.findByRole('heading', { name: /unsaved changes/i })).toBeInTheDocument()
    expect(openWorkspaceMock).not.toHaveBeenCalled()
  })

  it('proceeds to picker after user confirms discard', async () => {
    useGraphStore.setState({ dirty: true })
    openWorkspaceMock.mockResolvedValue({ status: 'canceled' })
    renderWithTheme(<Topbar />)
    fireEvent.click(screen.getByRole('button', { name: /switch workspace/i }))
    fireEvent.click(await screen.findByRole('button', { name: /discard/i }))
    await waitFor(() => expect(openWorkspaceMock).toHaveBeenCalled())
  })

  it('opens hotkey reference dialog from keyboard icon', async () => {
    renderWithTheme(<Topbar />)
    fireEvent.click(screen.getByRole('button', { name: /keyboard reference/i }))
    expect(await screen.findByText(/keyboard & mouse reference/i)).toBeInTheDocument()
  })

  it('opens about dialog from info icon', async () => {
    renderWithTheme(<Topbar />)
    fireEvent.click(screen.getByRole('button', { name: /^about$/i }))
    expect(await screen.findByText(/about diff forge/i)).toBeInTheDocument()
  })
})
