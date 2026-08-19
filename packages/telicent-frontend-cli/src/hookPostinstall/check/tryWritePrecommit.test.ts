import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest'
import { fs as memfs, vol } from 'memfs'
import { tryWritePrecommit } from './tryWritePrecommit.js' // Adjust the import path as needed

vi.mock('fs', () => ({
  default: {
    ...memfs,
    promises: memfs.promises,
  },
}))

vi.mock('chalk', () => ({
  default: {
    yellowBright: (text: string) => text,
    redBright: (text: string) => text,
    greenBright: (text: string) => text,
    green: (text: string) => text,
    whiteBright: (text: string) => text,
    yellow: (text: string) => text,
  },
}))

let consoleOutput: string[] = []
const mockedConsoleError = (output: string) => consoleOutput.push(output)

describe('tryWritePrecommit Functionality', () => {
  beforeEach(() => {
    vol.reset() // Clear the in-memory file system
    vol.mkdirSync('./.husky', { recursive: true })
    consoleOutput = [] // Reset captured console output
    global.console.error = mockedConsoleError // Capture console.error output
  })

  afterEach(() => {
    vol.reset()
  })

  it('should alert and exit if pre-commit file does not exist', () => {
    expect(() => tryWritePrecommit()).toThrowErrorMatchingInlineSnapshot(
      `[Error: process.exit unexpectedly called with "1"]`,
    )
    expect(consoleOutput).toMatchInlineSnapshot(`
      [
        "USER ACTION NEEDED - Expected .husky/pre-commit",
      ]
    `)
  })

  it('should append command if pre-commit file exists but does not contain the command', () => {
    vol.writeFileSync('./.husky/pre-commit', '# Initial content')
    expect(() => tryWritePrecommit()).toThrowErrorMatchingInlineSnapshot(
      `[Error: process.exit unexpectedly called with "1"]`,
    )
    expect(consoleOutput).toMatchInlineSnapshot(`
      [
        "USER ACTION NEEDED - Added tefe hook-precommit to .husky/pre-commit",
      ]
    `)
    expect(vol.readFileSync('./.husky/pre-commit', 'utf-8')).toContain(
      'tefe hook-precommit # @telicent-oss/telicent-frontend-cli',
    )
  })

  it('should do nothing if the command already exists in pre-commit', () => {
    vol.writeFileSync('./.husky/pre-commit', 'tefe hook-precommit')
    expect(() => tryWritePrecommit()).not.toThrow()
    expect(consoleOutput).toMatchInlineSnapshot(`[]`)
  })
})
