import { memo, useEffect, useMemo, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import StorageProviderSelector from './StorageProviderSelector'
import SourceInput from './SourceInput'
import MetadataEditor from './MetadataEditor'
import MigrationProgress from './MigrationProgress'
import { useVideoMigration } from '../../hooks/useVideoMigration'
import { storageProviders } from '../../config/storageProviders'

const DEFAULT_METADATA = {
  title: '',
  description: '',
  thumbnail: '',
  visibility: 'public',
  tags: [],
}

function revokeObjectUrlSafe(value) {
  const next = String(value || '').trim()
  if (!next) return

  if (typeof window === 'undefined' || !window.URL || typeof window.URL.revokeObjectURL !== 'function') {
    return
  }

  try {
    window.URL.revokeObjectURL(next)
  } catch {
    // ignore URL revocation failures
  }
}

function sanitizeLocalFileName(fileName) {
  const normalized = String(fileName || '').trim()
  if (!normalized) {
    return `upload-${Date.now()}`
  }

  return normalized.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '') || `upload-${Date.now()}`
}

function inferTitleFromLocalFile(fileName) {
  const normalized = String(fileName || '').trim()
  if (!normalized) {
    return ''
  }

  const withoutExtension = normalized.replace(/\.[^.]+$/, '')
  return withoutExtension || normalized
}

function buildLocalMigrationSourceUrl(file) {
  const safeName = sanitizeLocalFileName(file?.name)
  return `https://local-upload.octopussol/${encodeURIComponent(safeName)}`
}

function mapProviderNameToId(name) {
  const normalized = String(name || '').trim().toLowerCase()
  if (!normalized) return ''
  if (normalized === 'google drive') return 'gdrive'
  if (normalized === 'idrive e2') return 'idrive'
  if (normalized === 'custom s3') return 's3'
  return normalized
}

const MigrationForm = memo(function MigrationForm({
  onConnectProvider,
  onMigrationComplete,
  connectedProviders = [],
}) {
  const completionRef = useRef('')
  const localPlaybackUrlRef = useRef('')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [sourceType, setSourceType] = useState('url')
  const [sourceUrl, setSourceUrl] = useState('')
  const [localFile, setLocalFile] = useState(null)
  const [metadata, setMetadata] = useState(DEFAULT_METADATA)
  const [validationError, setValidationError] = useState('')
  const [formError, setFormError] = useState('')

  const {
    validateVideo,
    startMigration,
    progressState,
    validationResult,
    isValidating,
    isStarting,
    isPolling,
    stageLabel,
    stageTimeline,
  } = useVideoMigration()

  const connectedProviderIds = useMemo(() => {
    const options = Array.isArray(connectedProviders) ? connectedProviders : []
    return options
      .map((provider) => mapProviderNameToId(provider))
      .filter(Boolean)
  }, [connectedProviders])

  const mergedProviders = useMemo(() => {
    const base = Array.isArray(storageProviders)
      ? storageProviders.map((provider) => ({
        id: provider.id,
        label: provider.name,
      }))
      : []

    if (!base.some((provider) => provider.id === 's3')) {
      base.push({ id: 's3', label: 'Custom S3' })
    }

    return base
  }, [])

  const normalizedSelectedProvider = String(selectedProvider || '').trim().toLowerCase()
  const selectedProviderConnected = connectedProviderIds.includes(normalizedSelectedProvider)
  const disableActions = isValidating || isStarting
  const effectiveSourceUrl = sourceType === 'url'
    ? String(sourceUrl || '').trim()
    : buildLocalMigrationSourceUrl(localFile)
  const hasSourceReady = sourceType === 'url'
    ? Boolean(String(sourceUrl || '').trim())
    : Boolean(localFile)

  useEffect(() => {
    if (!connectedProviderIds.length) {
      if (normalizedSelectedProvider) {
        setSelectedProvider('')
      }
      return
    }

    if (normalizedSelectedProvider && connectedProviderIds.includes(normalizedSelectedProvider)) {
      return
    }

    setSelectedProvider(connectedProviderIds[0])
  }, [connectedProviderIds, normalizedSelectedProvider])

  useEffect(() => {
    if (!progressState.completed || !progressState.videoId) {
      return
    }

    const completionKey = `${String(progressState.jobId || '').trim()}:${String(progressState.videoId || '').trim()}`
    if (!completionKey || completionRef.current === completionKey) {
      return
    }

    completionRef.current = completionKey

    const completedPlaybackUrl = String(progressState.playbackUrl || '').trim()
    const localPlaybackUrl = String(localPlaybackUrlRef.current || '').trim()
    const completionSourceUrl = sourceType === 'local'
      ? (completedPlaybackUrl || localPlaybackUrl || effectiveSourceUrl)
      : (completedPlaybackUrl || effectiveSourceUrl)

    onMigrationComplete?.({
      jobId: progressState.jobId,
      videoId: progressState.videoId,
      sourceType,
      sourceUrl: completionSourceUrl,
      originalSourceUrl: effectiveSourceUrl,
    })
  }, [effectiveSourceUrl, onMigrationComplete, progressState.completed, progressState.jobId, progressState.playbackUrl, progressState.videoId, sourceType])

  const handleValidateVideo = async () => {
    setValidationError('')
    setFormError('')

    if (!selectedProvider) {
      setFormError('Select a storage provider first.')
      return
    }

    if (!selectedProviderConnected) {
      setFormError('Provider is not connected. Connect it before validation.')
      return
    }

    if (sourceType !== 'url') {
      setFormError('URL validation is only for Direct Video URL mode. For local uploads, proceed with Start Migration.')
      return
    }

    try {
      await validateVideo(sourceUrl, selectedProvider)
    } catch (error) {
      setValidationError(String(error?.message || 'Validation failed.'))
    }
  }

  const handleStartMigration = async () => {
    setFormError('')

    if (!selectedProvider) {
      setFormError('Select a storage provider before starting migration.')
      return
    }

    if (!selectedProviderConnected) {
      setFormError('Provider is not connected. Connect it before migration.')
      return
    }

    if (!metadata.title.trim()) {
      setFormError('Title is required.')
      return
    }

    if (!hasSourceReady) {
      setFormError(sourceType === 'url' ? 'Video URL is required.' : 'Select a local video file first.')
      return
    }

    try {
      completionRef.current = ''
      await startMigration({
        sourceUrl: effectiveSourceUrl,
        provider: selectedProvider,
        sourceType,
        localFile,
        metadata,
      })
    } catch (error) {
      setFormError(String(error?.message || 'Could not start migration.'))
    }
  }

  const canStartMigration = Boolean(selectedProvider)
    && selectedProviderConnected
    && hasSourceReady
    && Boolean(metadata.title.trim())
    && !disableActions

  const startBlockedReason = useMemo(() => {
    if (disableActions) {
      return ''
    }

    if (!selectedProvider) {
      return 'Select a connected storage provider first.'
    }

    if (!selectedProviderConnected) {
      return 'Selected provider is not connected. Click Connect/Use first.'
    }

    if (!hasSourceReady) {
      return sourceType === 'url'
        ? 'Enter a direct video URL first.'
        : 'Choose a local video file first.'
    }

    if (!metadata.title.trim()) {
      return 'Enter a video title first.'
    }

    return ''
  }, [disableActions, hasSourceReady, metadata.title, selectedProvider, selectedProviderConnected, sourceType])

  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Migration Post
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Import videos you own into your connected storage provider and publish metadata to your channel.
      </Typography>

      <StorageProviderSelector
        providers={mergedProviders}
        selectedProvider={selectedProvider}
        connectedProviders={connectedProviderIds}
        onProviderSelected={(provider) => {
          setSelectedProvider(provider)
          setFormError('')
        }}
        onRequestConnect={(provider) => onConnectProvider?.(provider)}
      />

      <SourceInput
        sourceType={sourceType}
        sourceUrl={sourceUrl}
        localFile={localFile}
        onSourceTypeChange={(next) => {
          setSourceType(next)
          setValidationError('')
          setFormError('')

          if (next !== 'local') {
            revokeObjectUrlSafe(localPlaybackUrlRef.current)
            localPlaybackUrlRef.current = ''
          }
        }}
        onSourceUrlChange={(value) => {
          setSourceUrl(value)
          setValidationError('')
        }}
        onLocalFileChange={(file) => {
          revokeObjectUrlSafe(localPlaybackUrlRef.current)
          localPlaybackUrlRef.current = ''

          if (file && typeof window !== 'undefined' && window.URL && typeof window.URL.createObjectURL === 'function') {
            try {
              localPlaybackUrlRef.current = window.URL.createObjectURL(file)
            } catch {
              localPlaybackUrlRef.current = ''
            }
          }

          setLocalFile(file)
          setValidationError('')
          setFormError('')

          if (!file) {
            return
          }

          setMetadata((previous) => {
            if (String(previous?.title || '').trim()) {
              return previous
            }

            const inferredTitle = inferTitleFromLocalFile(file.name)
            if (!inferredTitle) {
              return previous
            }

            return {
              ...previous,
              title: inferredTitle,
            }
          })
        }}
        validationError={validationError}
      />

      <MetadataEditor
        metadata={metadata}
        onChange={(nextMetadata) => {
          setMetadata(nextMetadata)
          setFormError('')
        }}
      />

      {startBlockedReason ? <Alert severity="info">{startBlockedReason}</Alert> : null}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
        <Button
          variant="outlined"
          onClick={handleValidateVideo}
          disabled={disableActions || !selectedProvider || sourceType !== 'url' || !sourceUrl.trim()}
          sx={{ textTransform: 'none' }}
        >
          {isValidating ? 'Validating…' : 'Validate Video'}
        </Button>

        <Button
          variant="contained"
          onClick={handleStartMigration}
          disabled={!canStartMigration}
          sx={{ textTransform: 'none' }}
        >
          {isStarting ? 'Starting…' : isPolling ? 'Migration Running…' : 'Start Migration'}
        </Button>
      </Box>

      <MigrationProgress
        progress={progressState.progress}
        stageLabel={stageLabel}
        stageTimeline={stageTimeline}
        completed={progressState.completed}
        error={progressState.error || formError}
        warning={progressState.providerUploadWarning}
      />

      {validationResult ? (
        <Alert severity="success">
          Validation passed: {validationResult.filename || 'video'} ({validationResult.mime || 'video/*'})
        </Alert>
      ) : null}

      {progressState.completed && progressState.videoId ? (
        <Alert severity="success">
          Migration completed. Opening video playback.
        </Alert>
      ) : null}
    </Stack>
  )
})

export default MigrationForm

