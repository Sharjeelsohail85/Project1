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

  const selectedProviderConnected = connectedProviderIds.includes(String(selectedProvider || '').trim().toLowerCase())
  const disableActions = isValidating || isStarting
  const effectiveSourceUrl = sourceType === 'url'
    ? sourceUrl
    : String(localFile?.name || '').trim()

  useEffect(() => {
    if (!progressState.completed || !progressState.videoId) {
      return
    }

    const completionKey = `${String(progressState.jobId || '').trim()}:${String(progressState.videoId || '').trim()}`
    if (!completionKey || completionRef.current === completionKey) {
      return
    }

    completionRef.current = completionKey
    onMigrationComplete?.({
      jobId: progressState.jobId,
      videoId: progressState.videoId,
      sourceUrl: effectiveSourceUrl,
    })
  }, [effectiveSourceUrl, onMigrationComplete, progressState.completed, progressState.jobId, progressState.videoId])

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
      setFormError('Validation currently requires Direct Video URL source.')
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

    if (sourceType !== 'url') {
      setFormError('Current migration lifecycle uses URL-based backend job start.')
      return
    }

    try {
      completionRef.current = ''
      await startMigration({
        sourceUrl,
        provider: selectedProvider,
        metadata,
      })
    } catch (error) {
      setFormError(String(error?.message || 'Could not start migration.'))
    }
  }

  const canStartMigration = Boolean(selectedProvider)
    && selectedProviderConnected
    && sourceType === 'url'
    && Boolean(sourceUrl.trim())
    && Boolean(metadata.title.trim())
    && !disableActions

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
        }}
        onSourceUrlChange={(value) => {
          setSourceUrl(value)
          setValidationError('')
        }}
        onLocalFileChange={(file) => {
          setLocalFile(file)
          setValidationError('')
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

      {progressState.completed && progressState.videoId ? (
        <Alert severity="success">
          Migration completed. Opening video playback.
        </Alert>
      ) : null}
    </Stack>
  )
})

export default MigrationForm

