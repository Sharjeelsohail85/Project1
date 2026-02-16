import axiosClient from './axiosClient'

export async function uploadVideo(formData, onProgress) {
  const response = await axiosClient.post('/api/videos', formData, {
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
