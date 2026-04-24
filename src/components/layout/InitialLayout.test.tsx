import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useNotificationsStore } from '@state/notificationsStore'
import { useWorkspaceStore } from '@state/workspaceStore'
import { renderWithTheme } from '@testing/test-utils'

import { InitialLayout } from './InitialLayout'
import { NotificationHost } from './NotificationHost'

function renderInitial() {
  return renderWithTheme(
    <>
      <InitialLayout />
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
      workspace: { status: vi.fn(), openAtPath: openAtPathMock },
      dialog: { openWorkspace: openWorkspaceMock },
      topology: { export: vi.fn(), load: vi.fn() }
    }
  })
})

afterEach(() => {
  delete (window as unknown as { electronAPI?: unknown }).electronAPI
})

describe('InitialLayout', () => {
  it('updates workspace status on successful pick', async () => {
    openWorkspaceMock.mockResolvedValue({
      status: 'opened',
      workspace: { valid: true, projectName: 'foo', cwd: '/tmp/foo' }
    })
    renderWithTheme(<InitialLayout />)
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
    renderInitial()
    fireEvent.click(screen.getByRole('button', { name: /open folder/i }))
    expect(await screen.findByText(/denied/i)).toBeInTheDocument()
  })

  it('leaves state unchanged on cancel', async () => {
    openWorkspaceMock.mockResolvedValue({ status: 'canceled' })
    renderWithTheme(<InitialLayout />)
    fireEvent.click(screen.getByRole('button', { name: /open folder/i }))
    await waitFor(() => expect(openWorkspaceMock).toHaveBeenCalled())
    expect(useWorkspaceStore.getState().status?.valid).toBe(false)
  })

  it('submits pasted path through openAtPath IPC', async () => {
    openAtPathMock.mockResolvedValue({
      status: 'opened',
      workspace: { valid: true, projectName: 'bar', cwd: '/tmp/bar' }
    })
    renderWithTheme(<InitialLayout />)
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
    renderInitial()
    fireEvent.change(screen.getByLabelText(/workspace path/i), {
      target: { value: '/nope' }
    })
    fireEvent.click(screen.getByRole('button', { name: /use path/i }))
    expect(await screen.findByText(/directory does not exist/i)).toBeInTheDocument()
  })

  it('disables Use path button when input is empty', () => {
    renderWithTheme(<InitialLayout />)
    expect(screen.getByRole('button', { name: /use path/i })).toBeDisabled()
  })
})
