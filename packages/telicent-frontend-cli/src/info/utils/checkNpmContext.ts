#!/usr/bin/env node

import * as fs from 'fs'
import formatJsonFile from '../../utils/formatJsonFile.js'

import { getTefeJson, TEFE_CONFIG } from '../../utils/tefe.config.json.utils.js'
import { readJsonAtInvoked } from '../../utils/readJsonAtInvoked.js'

export const TEFE = '@telicent-oss/telicent-frontend-cli'

type PackageJson = {
  name: string
  version: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}
function checkNpmContext() {
  const packageJson = `${process.cwd()}/package.json`
  const isNpmPackage = fs.existsSync(packageJson)
  const jsonAtInvoked = isNpmPackage
    ? (readJsonAtInvoked(packageJson) as unknown as PackageJson)
    : undefined
  const isTefePackage = jsonAtInvoked && jsonAtInvoked?.name === TEFE
  const isTefeInstalled = Boolean(
    jsonAtInvoked?.dependencies?.[TEFE] ||
      jsonAtInvoked?.devDependencies?.[TEFE],
  )
  const tefeJson = getTefeJson() ? formatJsonFile(TEFE_CONFIG) : false
  return [
    ['process.cwd():', process.cwd()],
    ['Current dir:', ''],
    ['  - is npm package:', isNpmPackage],
    [
      `  - is ${TEFE}:`,
      isTefePackage,
      jsonAtInvoked ? ` (${jsonAtInvoked.name}@${jsonAtInvoked.version})` : '',
    ],
    ['  - has tefe installed:', isTefeInstalled],
    [`  - has ${TEFE_CONFIG}:`, tefeJson],
  ]
}

export default checkNpmContext
