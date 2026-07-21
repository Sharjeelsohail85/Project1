export const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
export const THUMBNAIL_INPUT_ACCEPT = 'image/jpeg,image/png,image/webp'

export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
