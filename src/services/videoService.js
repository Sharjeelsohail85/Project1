import axiosClient from './axiosClient'

const LOCAL_CHANNEL_VIDEOS_KEY = 'my_channel_videos'

const SOURCE_TYPE_MAP = {
  uploadLink: 'Direct Link',
  uploadGoogle: 'Google Drive',
  uploadYoutube: 'YouTube',
  uploadFacebook: 'Facebook',
  uploadDropbox: 'Dropbox',
}

function getGoogleAccessTokenSafe() {
  if (typeof window === 'undefined') return ''

  try {
    const rawUser = window.localStorage.getItem('user_info')
    const user = rawUser ? JSON.parse(rawUser) : null
    return String(user?.google_access_token || user?.googleAccessToken || '').trim()
  } catch {
    return ''
  }
}

export function saveLocalChannelVideo(video) {
  if (typeof window === 'undefined' || !video) return

  try {
    const raw = window.localStorage.getItem(LOCAL_CHANNEL_VIDEOS_KEY)
    const existing = raw ? JSON.parse(raw) : []
    const list = Array.isArray(existing) ? existing : []
    const id = String(video?.uuid || video?.id || `local-video-${Date.now()}`).trim()
    const normalized = {
      uuid: id,
      id,
      name: String(video?.name || video?.title || 'Posted video').trim(),
      title: String(video?.title || video?.name || 'Posted video').trim(),
      type: String(video?.type || 'Upload').trim(),
      source_url: String(video?.source_url || video?.sourceUrl || video?.url || video?.video_url || '').trim(),
      video_url: String(video?.video_url || video?.sourceUrl || video?.url || video?.source_url || '').trim(),
      description: String(video?.description || video?.body || '').trim(),
      discussion_link: String(video?.discussion_link || video?.discussionLink || '').trim(),
      privacy_option: String(video?.privacy_option || 'public').trim(),
      privacyOption: video?.privacyOption || { data: { name: 'Public' } },
      channel_name: String(video?.channel_name || 'My Channel').trim(),
      channel: video?.channel || { name: 'My Channel', data: { name: 'My Channel' } },
      created_at: video?.created_at || new Date().toISOString(),
    }

    const next = [normalized, ...list.filter((item) => String(item?.uuid || item?.id || '') !== id)].slice(0, 100)
    window.localStorage.setItem(LOCAL_CHANNEL_VIDEOS_KEY, JSON.stringify(next))
  } catch {
    // ignore local persistence failures
  }
}

export async function uploadVideo(formData, onProgress) {
  const sourceTypeKey = String(formData.get('source_platform') || 'uploadLink')
  const backendType = SOURCE_TYPE_MAP[sourceTypeKey] || 'Direct Link'
  const googleAccessToken = getGoogleAccessTokenSafe()

  const response = await axiosClient.post('/video/link', {
    data: {
      url: formData.get('source_url') || formData.get('video_url') || '',
      type: backendType,
      name: formData.get('title') || '',
      description: formData.get('description') || '',
      discussion_link: formData.get('discussion_link') || '',
      privacy_option_id: formData.get('privacy') || 'public',
    },
  }, {
    headers: googleAccessToken ? { 'x-google-access-token': googleAccessToken } : {},
    onUploadProgress: (event) => {
      if (typeof onProgress !== 'function') {
        return
      }

      if (!event?.total) {
        onProgress(0)
        return
      }

      const percentage = Math.min(100, Math.round((event.loaded * 100) / event.total))
      onProgress(percentage)
    },
  })

  const payload = response.data?.data || response.data
  saveLocalChannelVideo(payload)

  return response.data
}

export default {
  uploadVideo,
  saveLocalChannelVideo,
}

export function getLocalChannelVideos() {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(LOCAL_CHANNEL_VIDEOS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
