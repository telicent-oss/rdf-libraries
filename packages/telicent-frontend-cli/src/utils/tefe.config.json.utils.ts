import * as fs from 'fs'
import { PACKAGE_JSON } from '../constants.js'
import { readJsonAtInternal } from './readJsonAtInternal.js'
export const TEFE_CONFIG = './tefe.config.json'

export const getTefeJson = () => {
  if (fs.existsSync(TEFE_CONFIG)) {
    const text = fs.readFileSync(TEFE_CONFIG)
    const json = JSON.parse(`${text}`)
    return json
  }
  return undefined
}

export const checkTefeJson = () => {
  const json = getTefeJson()
  if (json) {
    if (typeof json.version !== 'string') {
      throw Error('Expected "version" (string) field in')
    }
    return true
  }
  throw Error(`Perhaps file not created? could not find: ${TEFE_CONFIG}`)
}

export const createTefeJson = () => {
  if (getTefeJson()) {
    throw Error(`Cannot create already existing: ${TEFE_CONFIG}`)
  }

  const json = readJsonAtInternal(PACKAGE_JSON)
  fs.writeFileSync(
    TEFE_CONFIG,
    JSON.stringify(
      {
        version: json.version,
      },
      null,
      2,
    ),
    `utf-8`,
  )
  return true
}
