import axiosClient from './axiosClient'

const SOURCE_TYPE_MAP = {
  uploadLink: 'Direct Link',
  uploadGoogle: 'Google Drive',
  uploadYoutube: 'YouTube',
  uploadFacebook: 'Facebook',
  uploadDropbox: 'Dropbox',
}

export async function uploadVideo(formData, onProgress) {
  const sourceTypeKey = String(formData.get('source_platform') || 'uploadLink')
  const backendType = SOURCE_TYPE_MAP[sourceTypeKey] || 'Direct Link'

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

  return response.data
}

export default {
  uploadVideo,
}
