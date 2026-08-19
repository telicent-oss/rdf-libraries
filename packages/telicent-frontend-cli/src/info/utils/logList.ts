import chalk from 'chalk'
import padRightWithLength from '../../utils/padRightWithLength.js'
import clean from '../../utils/clean.js'

const logList = (log: typeof console.log, list: string[][]) => {
  const maxLen = Math.max(...list.map(([str]) => str.length))
  const pad = padRightWithLength(maxLen)
  list.forEach(([str, value, comment]) => {
    const valStr =
      typeof value !== 'boolean'
        ? value
        : value
          ? chalk.green(value)
          : chalk.red(value)
    log(clean(`${chalk.bold(pad(str))} ${valStr}${comment || ''}`))
  })
}

export default logList
