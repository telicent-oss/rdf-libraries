import * as fs from 'fs'
import * as path from 'path'
import { dirname } from './dirname.js'

// Reads a JSON file from the directory where the CLI package is located
export const readJsonAtInternal = (jsonPath: string) => {
  try {
    const fullPath = path.resolve(dirname, jsonPath)
    const text = fs.readFileSync(fullPath, 'utf8')
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`${jsonPath} from ${error}`)
  }
}
