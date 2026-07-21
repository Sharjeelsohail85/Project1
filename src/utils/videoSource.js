export const DEFAULT_VIDEO_SOURCE = {
  videoId: 'default-ocean-video',
  title: 'Ocean Aerial Stream',
  description: 'Featured daily stream preview on Octopussol.',
  sourceUrl: 'resources/ocean-video.webm',
  sourceType: 'creator_migrated',
  posterUrl: 'resources/photo.jpg'
}

export function resolvePlaybackSource(source) {
  if (!source) return { url: 'resources/ocean-video.webm', isIframe: false }
  const url = source.sourceUrl || source.url || 'resources/ocean-video.webm'
  const isIframe = url.includes('youtube.com') || url.includes('vimeo.com')
  return { url, isIframe }
}
