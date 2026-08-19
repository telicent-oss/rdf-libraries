const padRightWithLength = (length: number) => (str: string) => {
  return str + ' '.repeat(Math.max(0, length - str.length + 1))
}
export default padRightWithLength
