import type { Command } from 'commander' // Import Commander types if available
import formatJsonFile from '../utils/formatJsonFile.js'
import {
  createTefeJson,
  checkTefeJson,
  TEFE_CONFIG,
} from '../utils/tefe.config.json.utils.js'

interface ConfigOptions {
  init?: boolean
}

export const config = (options: ConfigOptions, _command: Command): void => {
  if (options.init) {
    createTefeJson()
    console.info(`${TEFE_CONFIG} created.`)
  } else {
    checkTefeJson()
    console.info(formatJsonFile(TEFE_CONFIG))
  }
}
