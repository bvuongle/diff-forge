import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCatalogStore } from '@state/catalogStore'
import { useGraphStore } from '@state/graphStore'
import { useNotificationsStore } from '@state/notificationsStore'
import { useUIStore } from '@state/uiStore'
import { useWorkspaceStore } from '@state/workspaceStore'
import { renderWithTheme } from '@testing/test-utils'

import { Topbar } from './Topbar'

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
  useCatalogStore.setState({ status: { status: 'loading' }, catalog: null })
  useNotificationsStore.setState({ notifications: [] })
  useUIStore.setState({ switchConfirmOpen: false })
})

afterEach(() => {
  delete (window as unknown as { electronAPI?: unknown }).electronAPI
})

describe('Topbar', () => {
  it('shows dirty marker on project chip when graph is dirty', () => {
    useGraphStore.setState({ dirty: true })
    renderWithTheme(<Topbar />)
    expect(screen.getByRole('button', { name: /switch workspace/i })).toHaveTextContent('diff-forge *')
  })

  it('disables export when workspace is invalid', () => {
    useWorkspaceStore.setState({ status: { valid: false, reason: 'home', cwd: '/Users/dev' } })
    renderWithTheme(<Topbar />)
    expect(screen.getByRole('button', { name: /export topology/i })).toBeDisabled()
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
