import { create } from 'zustand'

type Severity = 'success' | 'info' | 'warning' | 'error'

type Notification = {
  id: number
  message: string
  severity: Severity
  duration: number
}

type NotificationsStore = {
  notifications: Notification[]
  push: (message: string, severity: Severity, duration?: number) => number
  dismiss: (id: number) => void
}

let nextId = 1

const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: [],
  push: (message, severity, duration) => {
    const id = nextId++
    const defaultDuration = severity === 'warning' || severity === 'error' ? 8000 : 4000
    set((state) => ({
      notifications: [...state.notifications, { id, message, severity, duration: duration ?? defaultDuration }]
    }))
    return id
  },
  dismiss: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }))
}))

const notify = {
  success: (message: string, duration?: number) => useNotificationsStore.getState().push(message, 'success', duration),
  info: (message: string, duration?: number) => useNotificationsStore.getState().push(message, 'info', duration),
  warning: (message: string, duration?: number) => useNotificationsStore.getState().push(message, 'warning', duration),
  error: (message: string, duration?: number) => useNotificationsStore.getState().push(message, 'error', duration)
}

export { useNotificationsStore, notify }
export type { Severity }
