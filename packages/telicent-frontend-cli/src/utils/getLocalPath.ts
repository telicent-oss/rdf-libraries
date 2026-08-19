import path from 'path'
import getRealPath from '../info/utils/getRealPath.js'

export const getLocalPath = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_nodePath, binPath] = process.argv
  return path.resolve(getRealPath(binPath), '../../../')
}
