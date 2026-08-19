import * as fs from 'fs'
import * as path from 'path'

// Reads a JSON file from the directory where the CLI was invoked
export const readJsonAtInvoked = (jsonPath: string) => {
  const fullPath = path.resolve(process.cwd(), jsonPath)
  const text = fs.readFileSync(fullPath, 'utf8')
  return JSON.parse(text)
}
