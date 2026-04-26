import { WorkspaceInvalidReason, WorkspaceStatus } from './WorkspaceTypes'

function normalize(p: string): string {
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1)
  return p
}

function getWorkspaceName(cwd: string): string {
  const trimmed = normalize(cwd)
  const last = trimmed.split('/').pop() ?? ''
  return last
}

function checkWorkspace(cwd: string, homedir: string): WorkspaceStatus {
  const normalizedCwd = normalize(cwd)
  const normalizedHome = normalize(homedir)

  if (!normalizedCwd) return { valid: false, reason: 'empty', cwd }
  if (normalizedCwd === '/') return { valid: false, reason: 'root', cwd }
  if (normalizedCwd === normalizedHome) return { valid: false, reason: 'home', cwd }

  const name = getWorkspaceName(normalizedCwd)
  if (!name) return { valid: false, reason: 'empty', cwd }

  return { valid: true, name, cwd: normalizedCwd }
}

function reasonMessage(reason: WorkspaceInvalidReason): string {
  switch (reason) {
    case 'root':
      return 'Cannot run from filesystem root'
    case 'home':
      return 'Cannot run from home directory'
    case 'empty':
      return 'Working directory is empty'
  }
}

export { checkWorkspace, getWorkspaceName, reasonMessage }
