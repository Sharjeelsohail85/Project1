const DEFAULT_HTML5_URL = 'resources/video.mp4'

export const DEFAULT_VIDEO_SOURCE = Object.freeze({
  sourceType: 'uploadLink',
  sourceUrl: DEFAULT_HTML5_URL,
  title: '',
  description: '',
  discussionLink: '',
})

function toStringSafe(value) {
  return String(value || '').trim()
}

function parseUrl(value) {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function extractYouTubeId(rawUrl) {
  const parsed = parseUrl(rawUrl)
  if (!parsed) return ''

  const host = parsed.hostname.toLowerCase()
  if (host === 'youtu.be') {
    return parsed.pathname.replace(/^\//, '').split('/')[0]
  }

  if (host.endsWith('youtube.com')) {
    const byQuery = parsed.searchParams.get('v')
    if (byQuery) return byQuery

    const segments = parsed.pathname.split('/').filter(Boolean)
    const embedIndex = segments.findIndex((segment) => segment === 'embed' || segment === 'shorts')
    if (embedIndex >= 0 && segments[embedIndex + 1]) {
      return segments[embedIndex + 1]
    }
  }

  return ''
}

function extractGoogleDriveId(rawUrl) {
  const parsed = parseUrl(rawUrl)
  if (!parsed || !parsed.hostname.toLowerCase().endsWith('drive.google.com')) {
    return ''
  }

  const fromQuery = parsed.searchParams.get('id')
  if (fromQuery) return fromQuery

  const segments = parsed.pathname.split('/').filter(Boolean)
  const dIndex = segments.findIndex((segment) => segment === 'd')
  if (dIndex >= 0 && segments[dIndex + 1]) {
    return segments[dIndex + 1]
  }

  return ''
}

function toDropboxDirect(rawUrl) {
  const parsed = parseUrl(rawUrl)
  if (!parsed || !parsed.hostname.toLowerCase().endsWith('dropbox.com')) {
    return ''
  }

  if (parsed.hostname.toLowerCase() === 'dl.dropboxusercontent.com') {
    return parsed.toString()
  }

  parsed.hostname = 'dl.dropboxusercontent.com'
  parsed.searchParams.delete('dl')
  parsed.searchParams.set('raw', '1')
  return parsed.toString()
}

function isLikelyDirectVideo(rawUrl) {
  return /\.(mp4|webm|m3u8|ogg)(\?.*)?$/i.test(rawUrl)
}

export function resolvePlaybackSource({ sourceType, sourceUrl, title } = {}) {
  const type = toStringSafe(sourceType).toLowerCase()
  const url = toStringSafe(sourceUrl)

  if (!url) {
    return {
      mode: 'html5',
      src: DEFAULT_HTML5_URL,
      title: toStringSafe(title),
      provider: 'direct',
      openUrl: DEFAULT_HTML5_URL,
    }
  }

  const youtubeId = extractYouTubeId(url)
  if (youtubeId || type === 'uploadyoutube') {
    const id = youtubeId || extractYouTubeId(url)
    if (id) {
      return {
        mode: 'iframe',
        src: `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1`,
        title: toStringSafe(title),
        provider: 'youtube',
        openUrl: url || `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
      }
    }
  }

  const driveId = extractGoogleDriveId(url)
  if (driveId || type === 'uploadgoogle') {
    return {
      mode: 'iframe',
      src: driveId ? `https://drive.google.com/file/d/${encodeURIComponent(driveId)}/preview` : url,
      title: toStringSafe(title),
      provider: 'google',
      openUrl: url,
    }
  }

  if (type === 'uploadfacebook' || /facebook\.com/i.test(url)) {
    return {
      mode: 'iframe',
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`,
      title: toStringSafe(title),
      provider: 'facebook',
      openUrl: url,
    }
  }

  const dropboxDirect = toDropboxDirect(url)
  if (dropboxDirect || type === 'uploaddropbox') {
    return {
      mode: 'html5',
      src: dropboxDirect || url,
      title: toStringSafe(title),
      provider: 'dropbox',
      openUrl: url,
    }
  }

  if (isLikelyDirectVideo(url) || type === 'uploadlink') {
    return {
      mode: 'html5',
      src: url,
      title: toStringSafe(title),
      provider: 'direct',
      openUrl: url,
    }
  }

  return {
    mode: 'iframe',
    src: url,
    title: toStringSafe(title),
    provider: 'external',
    openUrl: url,
  }
}
