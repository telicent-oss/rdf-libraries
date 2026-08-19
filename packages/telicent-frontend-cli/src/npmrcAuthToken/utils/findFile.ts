import * as fs from 'fs'
import * as path from 'path'

export function findFile(): string | null {
  let currentDir: string = process.cwd()
  const root: string = path.parse(currentDir).root

  while (currentDir !== root) {
    const npmrcPath: string = path.join(currentDir, '.npmrc')
    if (fs.existsSync(npmrcPath)) {
      return npmrcPath
    }
    currentDir = path.dirname(currentDir)
  }
  return null
}
