#!/usr/bin/env node
import clean from '../utils/clean.js'
import logList from './utils/logList.js'
import getRealPath from './utils/getRealPath.js'
import checkNpmContext from './utils/checkNpmContext.js'
import { PACKAGE_JSON } from '../constants.js'
import { readJsonAtInternal } from '../utils/readJsonAtInternal.js'
import type { Command } from 'commander'

const info: (
  options: Record<string, unknown>,
  _command: Command,
) => void = () => {
  const [nodePath, binPath] = process.argv

  logList(console.log, [
    ['Version!:', readJsonAtInternal(PACKAGE_JSON).version],
    ['CLI bin path:', clean(binPath)],
    ['CLI (real) path:', clean(getRealPath(binPath))],
    ['Node path:', clean(nodePath)],
    ...checkNpmContext(),
  ])
}

export default info
