import fs from 'fs'
import c from 'chalk'

const PRECOMMIT = '.husky/pre-commit'
const CMD = 'tefe hook-precommit'

const col = {
  ACTION: c.redBright(`USER ACTION NEEDED`),
  CMD: c.whiteBright(CMD),
  PRECOMMIT: c.whiteBright(PRECOMMIT),
}
export const tryWritePrecommit = (): void => {
  if (!fs.existsSync(PRECOMMIT)) {
    console.error(`${col.ACTION} - Expected ${col.PRECOMMIT}`)
    process.exit(1)
  }

  const file = fs.readFileSync(PRECOMMIT, 'utf-8')
  if (!file.includes(CMD)) {
    fs.appendFileSync(PRECOMMIT, `${CMD} # @telicent-oss/telicent-frontend-cli`)
    console.error(`${col.ACTION} - Added ${col.CMD} to ${PRECOMMIT}`)
    process.exit(1)
  }
}
