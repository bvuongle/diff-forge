import { create } from 'zustand'

import { WorkspaceStatus } from '@domain/workspace/WorkspaceTypes'

type WorkspaceStore = {
  status: WorkspaceStatus | null
  setStatus: (status: WorkspaceStatus) => void
}

const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  status: null,
  setStatus: (status) => set({ status })
}))

export { useWorkspaceStore }
