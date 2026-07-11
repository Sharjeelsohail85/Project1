import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import apiClient from '../lib/apiClient'
import { uploadToDropboxAndGetLink } from '../services/dropboxUploadService'

const DEFAULT_PROGRESS_STATE = {
  jobId: '',
  progress: 0,
  stage: '',
  completed: false,
  videoId: null,
  playbackUrl: '',
  error: '',
  providerUploadWarning: '',
}

const DEFAULT_METADATA = {
  title: '',
  description: '',
  thumbnail: '',
  visibility: 'public',
  tags: [],
}

const POLL_INTERVAL_MS = 3000

function getGoogleAccessTokenSafe() {
  if (typeof window === 'undefined') return ''

  try {
    const rawAccounts = localStorage.getItem('connected_accounts')
    const accounts = rawAccounts ? JSON.parse(rawAccounts) : []
    if (Array.isArray(accounts)) {
      const googleAccount = accounts.find((account) => {
        const provider = String(account?.provider || '').toLowerCase()
        return account?.connected && ['google', 'gdrive', 'googledrive', 'google-drive'].includes(provider)
      })
      const accountToken = String(
        googleAccount?.user?.google_access_token
          || googleAccount?.user?.googleAccessToken
          || googleAccount?.google_access_token
          || googleAccount?.googleAccessToken
          || '',
      ).trim()
      if (accountToken) return accountToken
    }
  } catch {
    // continue to user_info fallback
  }

  try {
    const rawUser = localStorage.getItem('user_info')
    const user = rawUser ? JSON.parse(rawUser) : null
    return String(user?.google_access_token || user?.googleAccessToken || '').trim()
  } catch {
    return ''
  }
}

function getDropboxAccessTokenSafe() {
  if (typeof window === 'undefined') return ''

  try {
    const rawAccounts = localStorage.getItem('connected_accounts')
    const accounts = rawAccounts ? JSON.parse(rawAccounts) : []
    if (Array.isArray(accounts)) {
      const dropboxAccount = accounts.find((account) => {
        const provider = String(account?.provider || '').toLowerCase()
        return account?.connected && ['dropbox'].includes(provider)
      })
      const accountToken = String(
        dropboxAccount?.user?.dropbox_access_token
          || dropboxAccount?.user?.dropboxAccessToken
          || dropboxAccount?.user?.access_token
          || dropboxAccount?.dropbox_access_token
          || dropboxAccount?.dropboxAccessToken
          || '',
      ).trim()
      if (accountToken) return accountToken
    }
  } catch {
    // continue to user_info fallback
  }

  try {
    const rawUser = localStorage.getItem('user_info')
    const user = rawUser ? JSON.parse(rawUser) : null
    return String(user?.dropbox_access_token || user?.dropboxAccessToken || user?.access_token || '').trim()
  } catch {
    return ''
  }
}

async function uploadLocalFileToGoogleDrive({ file, accessToken, title, description }) {
  if (!file || !accessToken) {
    throw new Error('Google Drive is not connected. Reconnect Google Drive, then upload again.')
  }

  const boundary = `octopussol_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const metadata = {
    name: title || file.name || `upload-${Date.now()}.mp4`,
    description: description || '',
    mimeType: file.type || 'video/mp4',
  }
  const delimiter = `--${boundary}\r
`
  const closeDelimiter = `\r
--${boundary}--`
  const prefix = `${delimiter}Content-Type: application/json; charset=UTF-8\r
\r
${JSON.stringify(metadata)}\r
${delimiter}Content-Type: ${metadata.mimeType}\r
\r
`
  const body = new Blob([prefix, file, closeDelimiter], { type: `multipart/related; boundary=${boundary}` })

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,mimeType,size', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Unable to upload video to Google Drive.')
  }

  return payload
}

function requireMigrationAuthParams() {
  if (typeof window === 'undefined') {
    throw new Error('Migration API requires an authenticated browser session.')
  }

  const token = String(localStorage.getItem('token') || localStorage.getItem('auth_token') || '').trim()
  const clientId = String(localStorage.getItem('client_id') || '').trim()

  if (!token || !clientId) {
    throw new Error('Please login first. Missing token/client_id for migration APIs.')
  }

  return {
    token,
    client_id: clientId,
  }
}

function sanitizeTags(tags) {
  if (!Array.isArray(tags)) return []
  const seen = new Set()

  return tags
    .map((tag) => String(tag || '').trim())
    .filter((tag) => {
      const key = tag.toLowerCase()
      if (!tag || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function normalizeMetadata(metadata) {
  const next = {
    ...DEFAULT_METADATA,
    ...(metadata && typeof metadata === 'object' ? metadata : {}),
  }

  next.title = String(next.title || '').trim()
  next.description = String(next.description || '').trim()
  next.thumbnail = String(next.thumbnail || '').trim()
  next.visibility = String(next.visibility || 'public').trim().toLowerCase() || 'public'
  next.tags = sanitizeTags(next.tags)

  return next
}

function deriveStageLabel(stage, completed) {
  if (completed) {
    return 'Done ✓'
  }

  const normalized = String(stage || '').toLowerCase()

  if (normalized === 'queued') return 'Queued…'
  if (normalized === 'downloading') return 'Fetching video…'
  if (normalized === 'uploading') return 'Uploading to provider…'
  if (normalized === 'finalizing') return 'Finalizing metadata…'
  if (normalized === 'failed') return 'Migration failed'
  return 'Starting migration…'
}

function buildStageList(rawStage, completed) {
  const normalized = String(rawStage || '').toLowerCase()

  const steps = [
    {
      key: 'queued',
      label: 'Queued…',
      done: completed || ['downloading', 'uploading', 'finalizing'].includes(normalized),
      active: !completed && normalized === 'queued',
    },
    {
      key: 'downloading',
      label: 'Fetching video…',
      done: completed || ['uploading', 'finalizing'].includes(normalized),
      active: !completed && normalized === 'downloading',
    },
    {
      key: 'uploading',
      label: 'Uploading to provider…',
      done: completed || normalized === 'finalizing',
      active: !completed && normalized === 'uploading',
    },
    {
      key: 'finalizing',
      label: completed ? 'Done ✓' : 'Finalizing metadata…',
      done: completed,
      active: !completed && normalized === 'finalizing',
    },
  ]

  return steps
}

function getErrorMessage(error, fallback = 'Migration request failed.') {
  if (!error) return fallback

  if (typeof error === 'string') return error

  let apiMessage = ''

  // 1. Check for Axios-style response data
  if (error?.response?.data) {
    const data = error.response.data
    if (typeof data === 'string') {
      apiMessage = data
    } else if (typeof data === 'object' && data !== null) {
      apiMessage = data.error_summary
        || data.message
        || (typeof data.error === 'string' ? data.error : (data.error?.error_summary || data.error?.message || ''))
        || (Array.isArray(data.error_description) ? data.error_description[0] : data.error_description)
        || data.error_code
        || (data.error ? JSON.stringify(data.error) : '')
    }
  }

  // 2. Check for direct properties on the error object itself (if it's not a standard Error or if it's a plain object)
  if (!apiMessage) {
    if (typeof error === 'object' && error !== null) {
      apiMessage = error.error_summary
        || error.message
        || (typeof error.error === 'string' ? error.error : (error.error?.error_summary || error.error?.message || ''))
        || (Array.isArray(error.error_description) ? error.error_description[0] : error.error_description)
        || error.error_code
    }
  }

  // 3. Fallback to standard error message
  if (!apiMessage && error?.message) {
    apiMessage = error.message
  }

  // 4. Final safety checks to prevent object stringification issues
  if (apiMessage && typeof apiMessage === 'object') {
    try {
      apiMessage = JSON.stringify(apiMessage)
    } catch {
      apiMessage = String(apiMessage)
    }
  }

  const finalString = String(apiMessage || fallback)
  if (finalString === '[object Object]') {
    try {
      return JSON.stringify(error)
    } catch {
      return fallback
    }
  }

  return finalString
}

function validateSourceUrl(url) {
  const value = String(url || '').trim()
  if (!value) {
    return { valid: false, reason: 'Video URL is required.' }
  }

  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, reason: 'Video URL must use http or https.' }
    }
  } catch {
    return { valid: false, reason: 'Enter a valid video URL.' }
  }

  if (/\.m3u8(\?|$)|\.mpd(\?|$)|manifest(\?|$)|playlist(\?|$)/i.test(value)) {
    return { valid: false, reason: 'Streaming playlist URLs are not allowed. Use a direct file URL.' }
  }

  return { valid: true }
}

export function useVideoMigration() {
  const [progressState, setProgressState] = useState(DEFAULT_PROGRESS_STATE)
  const [isValidating, setIsValidating] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const pollTimerRef = useRef(null)

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    setIsPolling(false)
  }, [])

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
      }
    }
  }, [])

  const updateProgressFromPayload = useCallback((jobId, payload) => {
    const progress = Number(payload?.progress)
    const completed = Boolean(payload?.completed)
    const stage = String(payload?.stage || '').trim().toLowerCase()
    const videoIdRaw = payload?.videoId ?? payload?.video_id ?? null
    const playbackUrlRaw = String(payload?.playbackUrl || payload?.playback_url || '').trim()

    setProgressState((previous) => ({
      ...previous,
      jobId: String(jobId || previous.jobId || ''),
      progress: Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : previous.progress,
      stage,
      completed,
      videoId: videoIdRaw == null || String(videoIdRaw).trim() === '' ? previous.videoId : videoIdRaw,
      playbackUrl: playbackUrlRaw || previous.playbackUrl,
      error: '',
      providerUploadWarning: Number.isFinite(validationResult?.size)
        && validationResult.size > 2 * 1024 * 1024 * 1024
        ? 'Large file detected (>2GB). Migration may take longer, but you can continue.'
        : previous.providerUploadWarning,
    }))

    if (completed) {
      stopPolling()
    }
  }, [stopPolling, validationResult?.size])

  const getProgress = useCallback(async (jobId) => {
    const normalizedJobId = String(jobId || '').trim()
    if (!normalizedJobId) {
      throw new Error('jobId is required for progress polling.')
    }

    const authParams = requireMigrationAuthParams()

    const response = await apiClient.get(`/migration/status/${encodeURIComponent(normalizedJobId)}`, {
      params: authParams,
    })
    const payload = response?.data?.data || response?.data || {}

    updateProgressFromPayload(normalizedJobId, payload)

    return payload
  }, [updateProgressFromPayload])

  const startPolling = useCallback((jobId) => {
    const normalizedJobId = String(jobId || '').trim()
    if (!normalizedJobId) {
      return
    }

    stopPolling()
    setIsPolling(true)

    pollTimerRef.current = setInterval(() => {
      getProgress(normalizedJobId).catch((error) => {
        setProgressState((previous) => ({
          ...previous,
          error: getErrorMessage(error, 'Network lost while polling migration status. Retrying…'),
        }))
      })
    }, POLL_INTERVAL_MS)
  }, [getProgress, stopPolling])

  const validateVideo = useCallback(async (url, provider) => {
    const validation = validateSourceUrl(url)
    if (!validation.valid) {
      throw new Error(validation.reason)
    }

    const normalizedProvider = String(provider || '').trim().toLowerCase()
    if (!normalizedProvider) {
      throw new Error('Select a storage provider before validating.')
    }

    setIsValidating(true)

    try {
      const authParams = requireMigrationAuthParams()
      const response = await apiClient.post('/migration/validate', {
        sourceUrl: String(url || '').trim(),
        provider: normalizedProvider,
        ...authParams,
      })

      const payload = response?.data?.data || response?.data || {}
      const normalized = {
        valid: Boolean(payload?.valid),
        size: Number(payload?.size || 0),
        mime: String(payload?.mime || ''),
        filename: String(payload?.filename || ''),
      }

      if (!normalized.valid) {
        throw new Error('Video validation failed. Provide a direct video file URL that you own.')
      }

      if (!String(normalized.mime || '').toLowerCase().startsWith('video/')) {
        throw new Error('URL did not resolve to a video mime type.')
      }

      if (/mpegurl|dash|x-mpegurl|application\/vnd\.apple\.mpegurl/i.test(normalized.mime)) {
        throw new Error('Streaming playlist URLs are not supported. Use a direct video file link.')
      }

      setValidationResult(normalized)
      setProgressState((previous) => ({
        ...previous,
        error: '',
        providerUploadWarning: normalized.size > 2 * 1024 * 1024 * 1024
          ? 'Large file detected (>2GB). Migration may take longer, but you can continue.'
          : '',
      }))

      return normalized
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to validate this video URL.')
      setProgressState((previous) => ({ ...previous, error: message }))
      throw new Error(message)
    } finally {
      setIsValidating(false)
    }
  }, [])

  const startMigration = useCallback(async (payload) => {
    const sourceUrl = String(payload?.sourceUrl || '').trim()
    const provider = String(payload?.provider || '').trim().toLowerCase()
    const sourceType = String(payload?.sourceType || 'url').trim().toLowerCase()
    const localFile = payload?.localFile || null
    const metadata = normalizeMetadata(payload?.metadata)

    if (sourceType !== 'local') {
      const validation = validateSourceUrl(sourceUrl)
      if (!validation.valid) {
        throw new Error(validation.reason)
      }
    } else if (!localFile) {
      throw new Error('Select a local video file before starting migration.')
    }

    if (!provider) {
      throw new Error('Select a storage provider before starting migration.')
    }

    if (!metadata.title) {
      throw new Error('Video title is required.')
    }

    setIsStarting(true)
    setProgressState((previous) => ({
      ...DEFAULT_PROGRESS_STATE,
      jobId: previous.jobId,
      providerUploadWarning: previous.providerUploadWarning,
    }))

    try {
      const authParams = requireMigrationAuthParams()

      if (sourceType === 'local') {
        if (provider === 'gdrive') {
          const googleAccessToken = getGoogleAccessTokenSafe()
          const driveFile = await uploadLocalFileToGoogleDrive({
            file: localFile,
            accessToken: googleAccessToken,
            title: metadata.title,
            description: metadata.description,
          })
          const driveFileId = String(driveFile?.id || '').trim()
          if (!driveFileId) {
            throw new Error('Google Drive upload did not return a file id.')
          }
          const playbackUrl = `/api/v1/google-drive/stream/${encodeURIComponent(driveFileId)}?access_token=${encodeURIComponent(googleAccessToken)}`
          const uploadJobId = `gdrive-upload-${driveFileId}`
          setProgressState({
            jobId: uploadJobId,
            progress: 100,
            stage: 'finalizing',
            completed: true,
            videoId: driveFileId,
            playbackUrl,
            error: '',
            providerUploadWarning: '',
          })
          setValidationResult({
            valid: true,
            size: Number(localFile?.size || 0),
            mime: String(driveFile?.mimeType || localFile?.type || 'video/mp4'),
            filename: String(driveFile?.name || localFile?.name || ''),
          })
          return { jobId: uploadJobId, videoId: driveFileId, playbackUrl }
        }

        if (provider === 'dropbox') {
          const dropboxToken = getDropboxAccessTokenSafe()
          if (!dropboxToken) {
            throw new Error('Dropbox is not connected. Reconnect Dropbox, then upload again.')
          }
          setProgressState((previous) => ({
            ...previous,
            stage: 'uploading',
            progress: 10,
            completed: false,
            error: '',
          }))

          const streamUrl = await uploadToDropboxAndGetLink(localFile, (pct) => {
            setProgressState((previous) => ({
              ...previous,
              progress: pct,
              stage: pct >= 100 ? 'finalizing' : 'uploading',
            }))
          })

          const uploadJobId = `dropbox-upload-${Date.now()}`
          setProgressState({
            jobId: uploadJobId,
            progress: 100,
            stage: 'finalizing',
            completed: true,
            videoId: uploadJobId,
            playbackUrl: streamUrl,
            error: '',
            providerUploadWarning: '',
          })
          setValidationResult({
            valid: true,
            size: Number(localFile?.size || 0),
            mime: String(localFile?.type || 'video/mp4'),
            filename: String(localFile?.name || ''),
          })
          return { jobId: uploadJobId, videoId: uploadJobId, playbackUrl: streamUrl }
        }

        setProgressState((previous) => ({
          ...previous,
          stage: 'uploading',
          progress: 10,
          completed: false,
          error: '',
        }))

        const googleAccessToken = provider === 'gdrive' ? getGoogleAccessTokenSafe() : ''
        const uploadPayload = new FormData()
        uploadPayload.append('video', localFile)
        uploadPayload.append('targetProvider', provider)
        uploadPayload.append('title', metadata.title)
        uploadPayload.append('description', metadata.description)
        uploadPayload.append('thumbnail', metadata.thumbnail)
        uploadPayload.append('visibility', metadata.visibility)
        uploadPayload.append('tags', JSON.stringify(Array.isArray(metadata.tags) ? metadata.tags : []))
        uploadPayload.append('token', authParams.token)
        uploadPayload.append('client_id', authParams.client_id)

        const response = await apiClient.post('/storage/upload', uploadPayload, {
          headers: googleAccessToken ? { 'x-google-access-token': googleAccessToken } : {},
          timeout: 10 * 60 * 1000,
        })
        const data = response?.data?.data || response?.data || {}
        const files = Array.isArray(data?.files) ? data.files : []
        const primaryFile = files[0] || {}

        const videoId = String(
          primaryFile?.videoUuid
          || primaryFile?.fileId
          || primaryFile?.id
          || '',
        ).trim()
        const playbackUrl = String(primaryFile?.playbackUrl || '').trim()

        if (!videoId) {
          throw new Error('Storage upload did not return a video id.')
        }

        const uploadJobId = `upload-${videoId}`

        setProgressState({
          jobId: uploadJobId,
          progress: 100,
          stage: 'finalizing',
          completed: true,
          videoId,
          playbackUrl,
          error: '',
          providerUploadWarning: '',
        })

        setValidationResult({
          valid: true,
          size: Number(primaryFile?.size || 0),
          mime: String(primaryFile?.mimeType || localFile?.type || 'video/mp4'),
          filename: String(primaryFile?.originalFilename || localFile?.name || ''),
        })

        return {
          jobId: uploadJobId,
          videoId,
          playbackUrl,
        }
      }

      const googleAccessToken = (provider === 'gdrive' || provider === 'google') ? getGoogleAccessTokenSafe() : ''
      const dropboxAccessToken = (provider === 'dropbox') ? getDropboxAccessTokenSafe() : ''
      const headers = {}
      if (googleAccessToken) {
        headers['x-google-access-token'] = googleAccessToken
      }
      if (dropboxAccessToken) {
        headers['x-dropbox-access-token'] = dropboxAccessToken
      }

      const response = await apiClient.post('/migration/start', {
        sourceUrl,
        provider,
        sourceType,
        googleAccessToken,
        dropboxAccessToken,
        metadata,
        ...authParams,
      }, {
        headers,
        timeout: sourceType === 'account' ? 120000 : 30000,
      })

      const data = response?.data?.data || response?.data || {}
      const jobId = String(data?.jobId || '').trim()

      if (!jobId) {
        throw new Error('Migration API did not return a jobId.')
      }

      setProgressState((previous) => ({
        ...previous,
        jobId,
        progress: 1,
        stage: 'queued',
      }))

      await getProgress(jobId)
      startPolling(jobId)

      return { jobId }
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to start migration job.')
      setProgressState((previous) => ({
        ...previous,
        error: message,
      }))
      throw new Error(message)
    } finally {
      setIsStarting(false)
    }
  }, [getProgress, startPolling])

  const resetMigrationState = useCallback(() => {
    stopPolling()
    setValidationResult(null)
    setProgressState(DEFAULT_PROGRESS_STATE)
  }, [stopPolling])

  const stageLabel = useMemo(() => deriveStageLabel(progressState.stage, progressState.completed), [progressState.completed, progressState.stage])
  const stageTimeline = useMemo(() => buildStageList(progressState.stage, progressState.completed), [progressState.completed, progressState.stage])

  return {
    validateVideo,
    startMigration,
    getProgress,
    resetMigrationState,
    stopPolling,
    isValidating,
    isStarting,
    isPolling,
    validationResult,
    progressState,
    stageLabel,
    stageTimeline,
  }
}

export default useVideoMigration

