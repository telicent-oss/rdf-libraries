import * as fs from 'fs'
import { extractTokens } from './utils/extractTokens.js'
import { findFile } from './utils/findFile.js'
import { mask } from './utils/mask.js'

/**
 * Logs or masks npmrc tokens based on environment setting.
 */
const getAllOrSpecificToken = (npmrcPath: string, specific?: string) => {
  const npmrcContent = fs.readFileSync(npmrcPath, 'utf8')
  const tokens = extractTokens(npmrcContent)

  if (specific && tokens[specific]) {
    console.log(
      process.env.UNMASK === 'true' ? tokens[specific] : mask(tokens[specific]),
    )
  } else {
    console.log(
      JSON.stringify(
        tokens,
        (_, v) => (typeof v === 'string' ? mask(v) : v),
        2,
      ),
    )
  }
}

/**
 * Main function to retrieve and handle tokens from .npmrc.
 * Allows securely accessing config values without embedding secrets in scripts.
 */
const npmrcAuthToken: (tokenKey?: string) => void = (tokenKey) => {
  try {
    const npmrcPath = findFile()
    if (!npmrcPath) {
      console.error('No .npmrc file found.')
      process.exit(1)
    }
    getAllOrSpecificToken(npmrcPath, tokenKey)
  } catch (error) {
    console.error(`Error: ${error}`)
    process.exit(1)
  }
}

export default npmrcAuthToken
