type WorkspaceStatus =
  | { valid: true; name: string; cwd: string }
  | { valid: false; reason: WorkspaceInvalidReason; cwd: string }

type WorkspaceInvalidReason = 'root' | 'home' | 'empty'

export type { WorkspaceStatus, WorkspaceInvalidReason }
