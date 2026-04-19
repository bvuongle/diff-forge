import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useNotificationsStore } from '@state/notificationsStore'
import { useWorkspaceStore } from '@state/workspaceStore'
import { renderWithTheme } from '@testing/test-utils'

import { NotificationHost } from './NotificationHost'
import { WelcomeScreen } from './WelcomeScreen'

function renderWelcome() {
  return renderWithTheme(
    <>
      <WelcomeScreen />
      <NotificationHost />
    </>
  )
}

const openWorkspaceMock = vi.fn()
const openAtPathMock = vi.fn()

beforeEach(() => {
  openWorkspaceMock.mockReset()
  openAtPathMock.mockReset()
  useWorkspaceStore.setState({ status: { valid: false, reason: 'empty', cwd: '' } })
  useNotificationsStore.setState({ notifications: [] })
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: {
      catalog: { load: vi.fn() },
      workspace: { status: vi.fn(), openAtPath: openAtPathMock },
      dialog: { openWorkspace: openWorkspaceMock },
      project: { export: vi.fn(), load: vi.fn() }
    }
  })
})

afterEach(() => {
  delete (window as unknown as { electronAPI?: unknown }).electronAPI
})

describe('WelcomeScreen', () => {
  it('renders heading and Open Folder button', () => {
    renderWithTheme(<WelcomeScreen />)
    expect(screen.getByText(/welcome to diff forge/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open folder/i })).toBeInTheDocument()
  })

  it('updates workspace status on successful pick', async () => {
    openWorkspaceMock.mockResolvedValue({
      status: 'opened',
      workspace: { valid: true, projectName: 'foo', cwd: '/tmp/foo' }
    })
    renderWithTheme(<WelcomeScreen />)
    fireEvent.click(screen.getByRole('button', { name: /open folder/i }))
    await waitFor(() => {
      expect(useWorkspaceStore.getState().status).toEqual({
        valid: true,
        projectName: 'foo',
        cwd: '/tmp/foo'
      })
    })
  })

  it('shows error when IPC fails', async () => {
    openWorkspaceMock.mockResolvedValue({ status: 'error', message: 'denied' })
    renderWelcome()
    fireEvent.click(screen.getByRole('button', { name: /open folder/i }))
    expect(await screen.findByText(/denied/i)).toBeInTheDocument()
  })

  it('leaves state unchanged on cancel', async () => {
    openWorkspaceMock.mockResolvedValue({ status: 'canceled' })
    renderWithTheme(<WelcomeScreen />)
    fireEvent.click(screen.getByRole('button', { name: /open folder/i }))
    await waitFor(() => expect(openWorkspaceMock).toHaveBeenCalled())
    expect(useWorkspaceStore.getState().status?.valid).toBe(false)
  })

  it('submits pasted path through openAtPath IPC', async () => {
    openAtPathMock.mockResolvedValue({
      status: 'opened',
      workspace: { valid: true, projectName: 'bar', cwd: '/tmp/bar' }
    })
    renderWithTheme(<WelcomeScreen />)
    fireEvent.change(screen.getByLabelText(/workspace path/i), {
      target: { value: '/tmp/bar' }
    })
    fireEvent.click(screen.getByRole('button', { name: /use path/i }))
    await waitFor(() => expect(openAtPathMock).toHaveBeenCalledWith({ path: '/tmp/bar' }))
    await waitFor(() => {
      expect(useWorkspaceStore.getState().status).toEqual({
        valid: true,
        projectName: 'bar',
        cwd: '/tmp/bar'
      })
    })
  })

  it('shows error when pasted path is invalid', async () => {
    openAtPathMock.mockResolvedValue({ status: 'error', message: 'Directory does not exist' })
    renderWelcome()
    fireEvent.change(screen.getByLabelText(/workspace path/i), {
      target: { value: '/nope' }
    })
    fireEvent.click(screen.getByRole('button', { name: /use path/i }))
    expect(await screen.findByText(/directory does not exist/i)).toBeInTheDocument()
  })

  it('disables Use path button when input is empty', () => {
    renderWithTheme(<WelcomeScreen />)
    expect(screen.getByRole('button', { name: /use path/i })).toBeDisabled()
  })
})
