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

const DEFAULT_DURATION: Record<Severity, number> = {
  success: 4000,
  info: 4000,
  warning: 8000,
  error: 8000
}

let nextId = 1

const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: [],
  push: (message, severity, duration) => {
    const id = nextId++
    const entry: Notification = {
      id,
      message,
      severity,
      duration: duration ?? DEFAULT_DURATION[severity]
    }
    set((state) => ({ notifications: [...state.notifications, entry] }))
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
