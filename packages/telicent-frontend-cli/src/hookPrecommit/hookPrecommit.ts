import { writePullRequestTemplate } from './check/writePullRequestTemplate.js'

export const hookPrecommit = (): void => {
  writePullRequestTemplate()
}
