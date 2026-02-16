import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  formatBytes,
  MAX_THUMBNAIL_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
} from '../config/upload.config'
import { uploadVideo } from '../services/videoService'

const INITIAL_VALUES = {
  title: '',
  privacy: 'public',
  discussion_link: '',
  description: '',
}

function parseValidationErrors(payload) {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  return Object.entries(payload).reduce((accumulator, [key, value]) => {
    if (Array.isArray(value)) {
      accumulator[key] = String(value[0] || '')
      return accumulator
    }

    accumulator[key] = String(value || '')
    return accumulator
  }, {})
}

export default function useVideoUploadForm({ onUnauthorized } = {}) {
  const [formValues, setFormValues] = useState(INITIAL_VALUES)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: 'success',
    message: '',
  })
  const [isVideoDragActive, setIsVideoDragActive] = useState(false)

  const previewUrlRef = useRef('')

  const resetThumbnailPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
    }

    setThumbnailPreviewUrl('')
  }, [])

  const setFieldError = useCallback((name, message) => {
    setFieldErrors((previous) => ({
      ...previous,
      [name]: message,
    }))
  }, [])

  const clearFieldError = useCallback((name) => {
    setFieldErrors((previous) => {
      if (!previous[name]) {
        return previous
      }

      const next = { ...previous }
      delete next[name]
      return next
    })
  }, [])

  const validateThumbnail = useCallback((file) => {
    if (!file) {
      return ''
    }

    if (!String(file.type || '').startsWith('image/')) {
      return 'Thumbnail must be an image file.'
    }

    if (file.size > MAX_THUMBNAIL_SIZE_BYTES) {
      return `Thumbnail must be less than ${formatBytes(MAX_THUMBNAIL_SIZE_BYTES)}.`
    }

    return ''
  }, [])

  const validateVideo = useCallback((file) => {
    if (!file) {
      return 'Video file is required.'
    }

    if (!String(file.type || '').startsWith('video/')) {
      return 'Please select a valid video file.'
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return `Video must be less than ${formatBytes(MAX_VIDEO_SIZE_BYTES)}.`
    }

    return ''
  }, [])

  const resetForm = useCallback(() => {
    setFormValues(INITIAL_VALUES)
    setThumbnailFile(null)
    setVideoFile(null)
    setUploadProgress(0)
    setFieldErrors({})
    setIsVideoDragActive(false)
    resetThumbnailPreview()
  }, [resetThumbnailPreview])

  const handleChange = useCallback((field) => (event) => {
    const value = event.target.value
    setFormValues((previous) => ({
      ...previous,
      [field]: value,
    }))
    clearFieldError(field)
  }, [clearFieldError])

  const setThumbnail = useCallback((file) => {
    const validationMessage = validateThumbnail(file)

    if (validationMessage) {
      setFieldError('thumbnail', validationMessage)
      return
    }

    clearFieldError('thumbnail')
    resetThumbnailPreview()

    if (!file) {
      setThumbnailFile(null)
      return
    }

    const nextUrl = URL.createObjectURL(file)
    previewUrlRef.current = nextUrl

    setThumbnailFile(file)
    setThumbnailPreviewUrl(nextUrl)
  }, [clearFieldError, resetThumbnailPreview, setFieldError, validateThumbnail])

  const setVideo = useCallback((file) => {
    if (!file) {
      setVideoFile(null)
      clearFieldError('video')
      return
    }

    const validationMessage = validateVideo(file)

    if (validationMessage) {
      setFieldError('video', validationMessage)
      return
    }

    setVideoFile(file)
    clearFieldError('video')
  }, [clearFieldError, setFieldError, validateVideo])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = ''
      }
    }
  }, [])

  const handleThumbnailInput = useCallback((event) => {
    const file = event.target.files?.[0] || null
    setThumbnail(file)
  }, [setThumbnail])

  const handleVideoInput = useCallback((event) => {
    const file = event.target.files?.[0] || null
    setVideo(file)
  }, [setVideo])

  const handleVideoDragEnter = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsVideoDragActive(true)
  }, [])

  const handleVideoDragOver = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsVideoDragActive(true)
  }, [])

  const handleVideoDragLeave = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsVideoDragActive(false)
  }, [])

  const handleVideoDrop = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsVideoDragActive(false)

    const droppedFile = event.dataTransfer?.files?.[0] || null
    if (!droppedFile) {
      return
    }

    setVideo(droppedFile)
  }, [setVideo])

  const closeSnackbar = useCallback(() => {
    setSnackbar((previous) => ({
      ...previous,
      open: false,
    }))
  }, [])

  const submitUpload = useCallback(async () => {
    const nextErrors = {}

    if (!formValues.title.trim()) {
      nextErrors.title = 'Title is required.'
    }

    const videoValidation = validateVideo(videoFile)
    if (videoValidation) {
      nextErrors.video = videoValidation
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors((previous) => ({ ...previous, ...nextErrors }))
      return null
    }

    const payload = new FormData()
    payload.append('title', formValues.title.trim())
    payload.append('privacy', formValues.privacy)
    payload.append('discussion_link', formValues.discussion_link.trim())
    payload.append('description', formValues.description.trim())

    if (thumbnailFile) {
      payload.append('thumbnail', thumbnailFile)
    }

    if (videoFile) {
      payload.append('video', videoFile)
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const data = await uploadVideo(payload, setUploadProgress)

      setSnackbar({
        open: true,
        severity: 'success',
        message: 'Video uploaded successfully.',
      })

      resetForm()
      return data
    } catch (error) {
      const status = error?.response?.status

      if (status === 401) {
        onUnauthorized?.()
        return null
      }

      if (status === 422) {
        const nextValidationErrors = parseValidationErrors(error?.response?.data?.errors)

        setFieldErrors((previous) => ({
          ...previous,
          ...nextValidationErrors,
        }))

        setSnackbar({
          open: true,
          severity: 'error',
          message: 'Please fix the highlighted validation errors.',
        })

        return null
      }

      const networkErrorMessage = 'Network error. Please check your connection and try again.'
      const fallbackMessage = 'Video upload failed. Please try again.'

      setSnackbar({
        open: true,
        severity: 'error',
        message: error?.response ? error?.response?.data?.message || fallbackMessage : networkErrorMessage,
      })

      return null
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [
    formValues.description,
    formValues.discussion_link,
    formValues.privacy,
    formValues.title,
    onUnauthorized,
    resetForm,
    thumbnailFile,
    validateVideo,
    videoFile,
  ])

  const selectedFiles = useMemo(() => ({
    thumbnail: thumbnailFile,
    video: videoFile,
  }), [thumbnailFile, videoFile])

  return {
    formValues,
    selectedFiles,
    thumbnailPreviewUrl,
    uploadProgress,
    isUploading,
    isVideoDragActive,
    fieldErrors,
    snackbar,
    handleChange,
    handleThumbnailInput,
    handleVideoInput,
    handleVideoDragEnter,
    handleVideoDragOver,
    handleVideoDragLeave,
    handleVideoDrop,
    closeSnackbar,
    submitUpload,
  }
}
