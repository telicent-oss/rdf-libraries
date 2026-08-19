import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import c from 'chalk'

const workflowsDir = './.github/workflows'

const targetCommands = [
  'npm install',
  'yarn install',
  /* skipped 'yarn' and 'npm i' to keep things simple */
]

/**
 * Matches a command only at a word boundary, so "pnpm install" is not read as
 * "npm install". Without this, no prefix can satisfy the check for a pnpm repo:
 * the required literal is "LOCAL_MACHINE=false npm install", which pnpm never
 * produces.
 */
const atWordBoundary = (cmd: string): RegExp =>
  new RegExp(`(?<![\\w-])${cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)

interface Step {
  run?: string
}

interface Job {
  steps: Step[]
}

interface WorkflowFile {
  jobs: Record<string, Job>
}

export const findWorkflowNpmInstallCommands = (): void => {
  const files = fs
    .readdirSync(workflowsDir)
    .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))

  let userActionNeeded = false

  files.forEach((file) => {
    const filePath = path.join(workflowsDir, file)
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const doc = yaml.parse(fileContents) as WorkflowFile

    Object.entries(doc.jobs).forEach(([jobName, job]) => {
      job?.steps?.forEach((step, index) => {
        targetCommands.forEach((cmd) => {
          if (!step.run) {
            return
          }
          const fullCmd = `LOCAL_MACHINE=false ${cmd}`
          if (
            atWordBoundary(cmd).test(step.run) &&
            !atWordBoundary(fullCmd).test(step.run)
          ) {
            const FILE = c.yellowBright(filePath)
            const JOB = c.yellowBright(jobName)
            const CMD = c.redBright(cmd)
            const NEW_CMD =
              c.greenBright(`LOCAL_MACHINE=false`) + ' ' + c.green(`${cmd}`)
            console.error(
              `Change file "${FILE}" job: ${JOB} '${CMD}' to '${NEW_CMD}'.`,
            )
            userActionNeeded = true
          }
        })
      })
    })
  })

  if (userActionNeeded) {
    const USER_ACTION_NEEDED = c.redBright(`USER ACTION NEEDED`)
    const CLI_NAME = c.whiteBright(`@telicent-oss/telicent-frontend-cli`)
    console.error(
      `${USER_ACTION_NEEDED} - Without above changes, ${CLI_NAME} may cause unintended consequences.`,
    )
    process.exit(1)
  }
}
