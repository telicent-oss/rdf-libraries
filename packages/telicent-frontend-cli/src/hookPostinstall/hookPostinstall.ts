import { findWorkflowNpmInstallCommands } from './check/findWorkflowNpmInstallCommands.js'
import { tryWritePrecommit } from './check/tryWritePrecommit.js'

export const hookPostinstall = (): void => {
  findWorkflowNpmInstallCommands()
  tryWritePrecommit()
}
