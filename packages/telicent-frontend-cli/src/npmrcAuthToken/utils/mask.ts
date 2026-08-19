export function mask(raw: unknown): string {
  const str = `${raw}`
  const visibleLength = 4
  const effectiveVisibleLength = Math.min(visibleLength, str.length)
  const maskLength = Math.max(0, str.length - effectiveVisibleLength) // Calculate safe mask length
  return str.substring(0, effectiveVisibleLength) + '*'.repeat(maskLength)
}
