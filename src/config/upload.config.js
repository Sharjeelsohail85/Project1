export const MAX_VIDEO_SIZE_BYTES = 1024 * 1024 * 512 // 512MB
export const MAX_THUMBNAIL_SIZE_BYTES = 1024 * 1024 * 10 // 10MB

export const VIDEO_INPUT_ACCEPT = 'video/*'
export const THUMBNAIL_INPUT_ACCEPT = 'image/*'

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / 1024 ** exponent

  return `${size.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}
