const LOCAL_VIDEOS_KEY = 'octopussol_local_channel_videos'

export function getLocalChannelVideos() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return []
    const stored = localStorage.getItem(LOCAL_VIDEOS_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLocalChannelVideo(video) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    const current = getLocalChannelVideos()
    const updated = [video, ...current]
    localStorage.setItem(LOCAL_VIDEOS_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save local video:', err)
  }
}

export async function uploadVideo(videoData) {
  const newVideo = {
    id: 'vid_' + Date.now(),
    title: videoData?.title || 'Untitled Video',
    description: videoData?.description || '',
    sourceUrl: videoData?.sourceUrl || videoData?.url || '',
    createdAt: new Date().toISOString()
  }
  saveLocalChannelVideo(newVideo)
  return { success: true, data: newVideo }
}
