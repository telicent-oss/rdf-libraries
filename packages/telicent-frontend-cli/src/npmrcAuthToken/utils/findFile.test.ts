import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { findFile } from './findFile.js' // Adjust the import path as necessary
import * as fs from 'fs'
import * as path from 'path'

vi.mock('fs')
vi.mock('path')

describe('findFile', () => {
  beforeEach(() => {
    vi.spyOn(process, 'cwd').mockReturnValue('/fake/directory')
    vi.spyOn(path, 'parse').mockReturnValue({
      root: '/',
      dir: '',
      base: '',
      ext: '',
      name: '',
    })
    vi.spyOn(path, 'dirname').mockImplementation((currentDir) => {
      return currentDir === '/fake/directory' ? '/' : '/fake'
    })
    vi.spyOn(path, 'join').mockImplementation((dir, file) => `${dir}/${file}`)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return the path to .npmrc if found', () => {
    vi.spyOn(fs, 'existsSync').mockImplementation(
      (path) => path === '/fake/directory/.npmrc',
    )

    const result = findFile()
    expect(result).toBe('/fake/directory/.npmrc')
  })

  it('should return null if .npmrc is not found', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)
    const result = findFile()
    expect(result).toBeNull()
  })
})
