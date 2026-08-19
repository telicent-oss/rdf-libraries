import * as fs from 'fs'

function getRealPath(path: string) {
  try {
    return fs.realpathSync(path)
  } catch (error) {
    // If there's an error resolving the path, return 'unknown'
    return `Unknown`
  }
}

export default getRealPath
