import { create } from 'zustand'

type UIStore = {
  leftPanelCollapsed: boolean
  rightPanelCollapsed: boolean
  searchQuery: string
  notificationMessage: string | null
  setLeftPanelCollapsed: (collapsed: boolean) => void
  setRightPanelCollapsed: (collapsed: boolean) => void
  setSearchQuery: (query: string) => void
  setNotificationMessage: (message: string | null) => void
}

const useUIStore = create<UIStore>((set) => ({
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  searchQuery: '',
  notificationMessage: null,
  setLeftPanelCollapsed: (collapsed) => set({ leftPanelCollapsed: collapsed }),
  setRightPanelCollapsed: (collapsed) => set({ rightPanelCollapsed: collapsed }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setNotificationMessage: (message) => set({ notificationMessage: message })
}))

export { useUIStore }
export type { UIStore }
