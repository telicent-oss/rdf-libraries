import * as util from 'util'
import * as fs from 'fs'

function formatJsonFile(filePath: string) {
  const config = fs.readFileSync(filePath, 'utf8')
  const parsedConfig = JSON.parse(config)
  return util
    .inspect(parsedConfig, {
      colors: true,
      depth: null,
      compact: false,
      breakLength: Infinity,
    })
    .split('\n')
    .map((line) => '  ' + line)
    .join('\n')
}
export default formatJsonFile
