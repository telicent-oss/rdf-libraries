#!/usr/bin/env node
import updateNotifier from 'update-notifier'
import { readJsonAtInternal } from './utils/readJsonAtInternal.js'
import { PACKAGE_JSON } from './constants.js'

const pkg = readJsonAtInternal(PACKAGE_JSON)
const MIN = 1000 * 60
updateNotifier({ pkg, updateCheckInterval: 10 * MIN }).notify()
