import fs from 'fs'
import { getLocalPath } from '../../utils/getLocalPath.js'
import { CTA } from '../../constants.js'

const pull_request_template_md = '.github/pull_request_template.md'
const CLI = `@telicent-oss/telicent-frontend-cli`

export const writePullRequestTemplate = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const local = getLocalPath()
  const localPRTemplateLoc = `${local}/${pull_request_template_md}`
  const outerPRTemplateLoc = `${process.cwd()}/${pull_request_template_md}`

  const localPRTemplate = fs.readFileSync(localPRTemplateLoc, 'utf-8')
  const outerPRTemplate = fs.existsSync(outerPRTemplateLoc)
    ? fs.readFileSync(outerPRTemplateLoc, 'utf-8')
    : undefined

  const updateWithReason = (reason: string) => {
    fs.writeFileSync(outerPRTemplateLoc, localPRTemplate)
    console.log(`${CTA} — ${reason}`)
    console.log(`Please check diff and commit.`)
    process.exit(1)
  }

  if (outerPRTemplate === undefined) {
    updateWithReason(`Created: Expected ${pull_request_template_md} to exist.`)
  } else if (outerPRTemplate !== localPRTemplate) {
    updateWithReason(
      `Overwritten: Expected ${pull_request_template_md} to match ${CLI}'s.`,
    )
  }
}
