import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { homedir, tmpdir } from 'os'
import path from 'path'

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

import { createFsWorkspaceStore } from './FsWorkspaceStore'

describe('FsWorkspaceStore', () => {
  let workspaceDir: string
  let cwdSpy: MockInstance<() => string>
  let chdirSpy: MockInstance<(directory: string) => void>

  beforeEach(async () => {
    workspaceDir = await mkdtemp(path.join(tmpdir(), 'fs-workspace-'))
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(workspaceDir)
    chdirSpy = vi.spyOn(process, 'chdir').mockImplementation((target: string) => {
      cwdSpy.mockReturnValue(target)
    })
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await rm(workspaceDir, { recursive: true, force: true })
  })

  describe('getStatus', () => {
    it('returns valid with workspace name when cwd is a real folder', async () => {
      const store = createFsWorkspaceStore({ selectDirectory: async () => null })
      const status = await store.getStatus()
      expect(status.valid).toBe(true)
      if (!status.valid) return
      expect(status.name).toBe(path.basename(workspaceDir))
    })

    it('returns invalid with reason "home" when cwd is the home dir', async () => {
      cwdSpy.mockReturnValue(homedir())
      const store = createFsWorkspaceStore({ selectDirectory: async () => null })
      const status = await store.getStatus()
      expect(status.valid).toBe(false)
      if (status.valid) return
      expect(status.reason).toBe('home')
    })
  })

  describe('openWorkspaceSelector', () => {
    it('returns canceled when no directory is selected', async () => {
      const store = createFsWorkspaceStore({ selectDirectory: async () => null })
      const result = await store.openWorkspaceSelector()
      expect(result.status).toBe('canceled')
      expect(chdirSpy).not.toHaveBeenCalled()
    })

    it('chdirs into the selected folder and returns opened', async () => {
      const selected = await mkdtemp(path.join(tmpdir(), 'fs-workspace-selected-'))
      const store = createFsWorkspaceStore({ selectDirectory: async () => selected })
      const result = await store.openWorkspaceSelector()
      expect(chdirSpy).toHaveBeenCalledWith(selected)
      expect(result.status).toBe('opened')
      if (result.status !== 'opened') return
      expect(result.workspace.valid).toBe(true)
      await rm(selected, { recursive: true, force: true })
    })

    it('returns error when directory selection throws', async () => {
      const store = createFsWorkspaceStore({
        selectDirectory: async () => {
          throw new Error('dialog failed')
        }
      })
      const result = await store.openWorkspaceSelector()
      expect(result.status).toBe('error')
      if (result.status !== 'error') return
      expect(result.message).toBe('dialog failed')
    })
  })

  describe('openAtPath', () => {
    it('returns error on empty input', async () => {
      const store = createFsWorkspaceStore({ selectDirectory: async () => null })
      const result = await store.openAtPath('   ')
      expect(result.status).toBe('error')
      if (result.status !== 'error') return
      expect(result.message).toBe('Path is empty')
    })

    it('returns error when path is not absolute', async () => {
      const store = createFsWorkspaceStore({ selectDirectory: async () => null })
      const result = await store.openAtPath('relative/path')
      expect(result.status).toBe('error')
      if (result.status !== 'error') return
      expect(result.message).toContain('absolute')
    })

    it('returns error when target does not exist', async () => {
      const store = createFsWorkspaceStore({ selectDirectory: async () => null })
      const result = await store.openAtPath('/nonexistent/diff-forge-test')
      expect(result.status).toBe('error')
      if (result.status !== 'error') return
      expect(result.message).toBe('Directory does not exist')
    })

    it('returns error when target is a file', async () => {
      const filePath = path.join(workspaceDir, 'a-file.txt')
      await writeFile(filePath, 'x', 'utf8')
      const store = createFsWorkspaceStore({ selectDirectory: async () => null })
      const result = await store.openAtPath(filePath)
      expect(result.status).toBe('error')
      if (result.status !== 'error') return
      expect(result.message).toBe('Path is not a directory')
    })

    it('chdirs and returns opened on a valid absolute directory', async () => {
      const target = await mkdtemp(path.join(tmpdir(), 'fs-workspace-target-'))
      const store = createFsWorkspaceStore({ selectDirectory: async () => null })
      const result = await store.openAtPath(target)
      expect(chdirSpy).toHaveBeenCalledWith(target)
      expect(result.status).toBe('opened')
      await rm(target, { recursive: true, force: true })
    })

    it('expands ~ to homedir before resolving', async () => {
      const store = createFsWorkspaceStore({ selectDirectory: async () => null })
      const result = await store.openAtPath('~')
      expect(chdirSpy).toHaveBeenCalledWith(homedir())
      expect(result.status).toBe('opened')
    })
  })

  describe('saveTopology', () => {
    it('writes <name>.forge.json under cwd and returns saved', async () => {
      const store = createFsWorkspaceStore({ selectDirectory: async () => null })
      const result = await store.saveTopology('[]')
      expect(result.status).toBe('saved')
      if (result.status !== 'saved') return
      const expectedPath = path.join(workspaceDir, `${path.basename(workspaceDir)}.forge.json`)
      expect(result.topologyPath).toBe(expectedPath)
      expect(await readFile(expectedPath, 'utf8')).toBe('[]')
    })

    it('returns invalidWorkspace when cwd is the home dir', async () => {
      cwdSpy.mockReturnValue(homedir())
      const store = createFsWorkspaceStore({ selectDirectory: async () => null })
      const result = await store.saveTopology('[]')
      expect(result.status).toBe('invalidWorkspace')
      if (result.status !== 'invalidWorkspace') return
      expect(result.reason).toBe('home')
    })
  })

  describe('loadTopology', () => {
    it('returns loaded when the topology file exists', async () => {
      const topologyPath = path.join(workspaceDir, `${path.basename(workspaceDir)}.forge.json`)
      await writeFile(topologyPath, '[1,2]', 'utf8')
      const store = createFsWorkspaceStore({ selectDirectory: async () => null })
      const result = await store.loadTopology()
      expect(result.status).toBe('loaded')
      if (result.status !== 'loaded') return
      expect(result.topology).toBe('[1,2]')
      expect(result.topologyPath).toBe(topologyPath)
    })

    it('returns notFound when no topology file is present', async () => {
      const store = createFsWorkspaceStore({ selectDirectory: async () => null })
      const result = await store.loadTopology()
      expect(result.status).toBe('notFound')
    })

    it('returns notFound when cwd is invalid', async () => {
      cwdSpy.mockReturnValue('/')
      const store = createFsWorkspaceStore({ selectDirectory: async () => null })
      const result = await store.loadTopology()
      expect(result.status).toBe('notFound')
    })
  })
})
