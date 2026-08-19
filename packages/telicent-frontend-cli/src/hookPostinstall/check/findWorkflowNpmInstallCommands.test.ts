import { describe, it, beforeEach, vi, expect, afterEach } from 'vitest'
import { fs as memfs, vol } from 'memfs'

vi.mock('fs', () => ({
  default: {
    ...memfs,
    promises: memfs.promises,
  },
}))

vi.mock('path', () => ({
  default: {
    join: (...args: string[]) => args.join('/'),
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

import { findWorkflowNpmInstallCommands } from './findWorkflowNpmInstallCommands.js'

let consoleOutput: string[] = []
const mockedConsoleError = (output: string) => consoleOutput.push(output)
global.console.error = mockedConsoleError

describe('Workflow Command Finder', () => {
  beforeEach(() => {
    vol.reset()
    vol.mkdirSync('./.github', { recursive: true })
    vol.mkdirSync('./.github/workflows', { recursive: true })
    consoleOutput = []
  })

  it('should identify commands needing prefix', () => {
    vol.writeFileSync(
      './.github/workflows/workflow.yml',
      `
jobs:
  build:
    steps:
      - run: npm install
      - run: LOCAL_MACHINE=false npm install
      `,
    )
    expect(() =>
      findWorkflowNpmInstallCommands(),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: process.exit unexpectedly called with "1"]`,
    )
    expect(consoleOutput).toMatchInlineSnapshot(`
      [
        "Change file "./.github/workflows/workflow.yml" job: build 'npm install' to 'LOCAL_MACHINE=false npm install'.",
        "USER ACTION NEEDED - Without above changes, @telicent-oss/telicent-frontend-cli may cause unintended consequences.",
      ]
    `)
  })

  it('should pass when all commands are compliant', () => {
    vol.writeFileSync(
      './.github/workflows/compliant.yml',
      `
jobs:
  build:
    steps:
      - run: LOCAL_MACHINE=false yarn install
      - run: LOCAL_MACHINE=false npm install
      `,
    )
    expect(() => findWorkflowNpmInstallCommands()).not.toThrow()
    expect(consoleOutput).toMatchInlineSnapshot(`[]`)
  })

  afterEach(() => {
    vol.reset()
  })
})
