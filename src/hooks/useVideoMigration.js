import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import apiClient from '../lib/apiClient'

const DEFAULT_PROGRESS_STATE = {
  jobId: '',
  progress: 0,
  stage: '',
  completed: false,
  videoId: null,
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
  const apiMessage = error?.response?.data?.message
    || error?.response?.data?.error
    || error?.response?.data?.error_description?.[0]

  return String(apiMessage || error?.message || fallback)
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

    setProgressState((previous) => ({
      ...previous,
      jobId: String(jobId || previous.jobId || ''),
      progress: Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : previous.progress,
      stage,
      completed,
      videoId: videoIdRaw == null || String(videoIdRaw).trim() === '' ? previous.videoId : videoIdRaw,
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
    const metadata = normalizeMetadata(payload?.metadata)

    const validation = validateSourceUrl(sourceUrl)
    if (!validation.valid) {
      throw new Error(validation.reason)
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
      const response = await apiClient.post('/migration/start', {
        sourceUrl,
        provider,
        metadata,
        ...authParams,
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

