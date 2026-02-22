import { memo, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useVideoUploadForm from '../hooks/useVideoUploadForm'
import {
  formatBytes,
  MAX_THUMBNAIL_SIZE_BYTES,
  THUMBNAIL_INPUT_ACCEPT,
} from '../config/upload.config'

const SOURCE_OPTIONS = [
  { id: 'uploadLink', icon: 'link', label: 'Paste a Link' },
  { id: 'uploadGoogle', icon: 'cloud_queue', label: 'Google Drive' },
  { id: 'uploadYoutube', icon: 'smart_display', label: 'YouTube' },
  { id: 'uploadFacebook', icon: 'facebook', label: 'Facebook' },
  { id: 'uploadDropbox', icon: 'folder_shared', label: 'Dropbox' },
]

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'unlisted', label: 'Unlisted' },
]

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function isValidHttpUrl(value) {
  if (!value) return false

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const Upload = memo(function Upload({
  active,
  step = 1,
  minStep = 1,
  maxStep = 3,
  onHideUpload,
  onNextUpload,
  onPrevUpload,
  onVideoReady,
}) {
  const {
    formValues,
    selectedFiles,
    thumbnailPreviewUrl,
    uploadProgress,
    isUploading,
    fieldErrors,
    snackbar,
    handleChange,
    handleThumbnailInput,
    closeSnackbar,
    submitUpload,
  } = useVideoUploadForm({
    onUnauthorized: () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      }
    },
  })

  const boundedStep = clamp(step, minStep, maxStep)
  const canGoPrev = boundedStep > minStep
  const canGoNext = boundedStep < maxStep

  const progressWidth = useMemo(() => {
    const span = Math.max(1, maxStep - minStep)
    return `${((boundedStep - minStep) / span) * 100}%`
  }, [boundedStep, minStep, maxStep])

  const [selectedSource, setSelectedSource] = useState('')
  const [sourceInputValue, setSourceInputValue] = useState('')
  const [sourceError, setSourceError] = useState('')

  const sourcePlaceholder = useMemo(() => {
    if (selectedSource === 'uploadGoogle') return 'Paste Google Drive URL'
    if (selectedSource === 'uploadYoutube') return 'Paste YouTube URL'
    if (selectedSource === 'uploadFacebook') return 'Paste Facebook URL'
    if (selectedSource === 'uploadDropbox') return 'Paste Dropbox URL'
    return 'Paste video URL'
  }, [selectedSource])

  const selectedSourceLabel = useMemo(
    () => SOURCE_OPTIONS.find((source) => source.id === selectedSource)?.label || 'Source link',
    [selectedSource],
  )
  const sourceUrlTrimmed = useMemo(() => sourceInputValue.trim(), [sourceInputValue])

  const validateSourceInput = () => {
    const trimmed = sourceInputValue.trim()

    if (!selectedSource) {
      setSourceError('Select a source platform.')
      return false
    }

    if (!trimmed) {
      setSourceError('Source URL is required.')
      return false
    }

    if (!isValidHttpUrl(trimmed)) {
      setSourceError('Enter a valid source URL (http or https).')
      return false
    }

    setSourceError('')
    return true
  }

  const handleNext = async () => {
    if (!canGoNext || isUploading) return

    if (boundedStep === 1) {
      if (!validateSourceInput()) return
      onNextUpload?.()
      return
    }

    if (boundedStep === 2) {
      const result = await submitUpload({
        sourceType: selectedSource,
        sourceUrl: sourceInputValue,
      })
      if (!result) return

      if (typeof onVideoReady === 'function') {
        onVideoReady({
          sourceType: selectedSource,
          sourceUrl: sourceInputValue.trim(),
          title: formValues.title.trim(),
          uploadResponse: result,
        })
        return
      }
    }

    onNextUpload?.()
  }

  const handlePrev = () => {
    if (!canGoPrev || isUploading) return
    onPrevUpload?.()
  }

  const floatButtonBaseSx = {
    minWidth: 0,
    padding: 0,
    textTransform: 'none',
    position: 'absolute',
    top: 20,
    width: 50,
    height: 50,
    borderRadius: '50%',
    color: '#fafafa',
    backgroundColor: 'rgba(96, 125, 139, 0.55)',
    boxShadow: '0 3px 5px rgba(0, 0, 0, 0.14), 0 1px 18px rgba(0, 0, 0, 0.12)',
    '&:hover': {
      backgroundColor: 'rgba(96, 125, 139, 0.9)',
    },
  }

  const helperTextNoShadowProps = {
    sx: {
      textShadow: 'none',
      textDecoration: 'none',
    },
  }

  const step2FieldSx = {
    '& .MuiFilledInput-root': {
      backgroundColor: '#fff',
      '&:before, &:after': {
        display: 'none',
      },
      '&:hover': {
        backgroundColor: '#fff',
      },
      '&.Mui-focused': {
        backgroundColor: '#fff',
      },
    },
    '& .MuiFilledInput-input': {
      color: '#424242',
    },
    '& .MuiSelect-icon': {
      color: '#424242',
    },
    '& .MuiFormHelperText-root': {
      textShadow: 'none',
      textDecoration: 'none',
    },
  }

  const step2InputWrapperSx = {
    boxShadow: 'none !important',
  }

  const mediaDropZoneSx = {
    flex: { xs: '1 1 100%', sm: '0 0 220px' },
    minHeight: 120,
    border: '2px dashed rgba(255,255,255,0.45)',
    borderRadius: 1,
    backgroundImage: 'url("/resources/photo.jpg")',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    p: 2,
    cursor: 'pointer',
    float: 'none',
    width: 'auto',
    marginRight: 0,
  }

  const step2DescriptionFieldSx = {
    ...step2FieldSx,
    '& .MuiInputBase-inputMultiline': {
      maxHeight: 120,
      overflowY: 'auto !important',
    },
  }

  return (
    <section
      id="upload"
      className={`upload ${active ? 'active' : ''}`}
      aria-label="Upload video"
      aria-hidden={!active}
    >
      <Button
        id="uploadClose"
        className="upload-close button-float active"
        onClick={() => onHideUpload?.()}
        aria-label="Close upload"
        type="button"
        variant="text"
        color="inherit"
        disableElevation
        disableRipple
        sx={{ ...floatButtonBaseSx, right: 20 }}
      >
        <i className="material-icons" aria-hidden="true">close</i>
      </Button>

      <Button
        id="uploadNext"
        className={`upload-next button-float ${canGoNext ? 'active' : ''}`}
        onClick={() => {
          void handleNext()
        }}
        aria-label="Next upload step"
        type="button"
        variant="text"
        color="inherit"
        disableElevation
        disableRipple
        disabled={!canGoNext || isUploading}
        sx={{ ...floatButtonBaseSx, right: 90 }}
      >
        <i className="material-icons" aria-hidden="true">navigate_next</i>
      </Button>

      <Button
        id="uploadPrev"
        className={`upload-prev button-float ${canGoPrev ? 'active' : ''}`}
        onClick={handlePrev}
        aria-label="Previous upload step"
        type="button"
        variant="text"
        color="inherit"
        disableElevation
        disableRipple
        disabled={!canGoPrev || isUploading}
        sx={{ ...floatButtonBaseSx, right: 160 }}
      >
        <i className="material-icons" aria-hidden="true">navigate_before</i>
      </Button>

      <div className="signup-progress upload-progress" aria-hidden="true">
        <div id="uploadProgressBar" className="signup-progress-bar" style={{ width: progressWidth }} />
      </div>

      <div id="upload1" className={`upload-page ${boundedStep === 1 ? 'active' : ''}`}>
        <h2 className="upload-title">Post a Video Link</h2>
        <p className="upload-desc">Choose a platform and add your video URL.</p>

        {SOURCE_OPTIONS.map((source) => (
          <Button
            key={source.id}
            id={source.id}
            className="upload-item-select"
            onClick={() => {
              setSelectedSource(source.id)
              setSourceInputValue('')
              setSourceError('')
            }}
            aria-label={source.label}
            type="button"
            variant="text"
            color="inherit"
            disableElevation
            disableRipple
            sx={{ minWidth: 0, padding: 0, textTransform: 'none' }}
          >
            <i className="material-icons" aria-hidden="true">{source.icon}</i>
          </Button>
        ))}

        <div id="uploadLinkBox" className={`upload-link ${selectedSource ? 'active' : ''}`}>
          <Button
            className="upload-link-back"
            onClick={() => {
              setSelectedSource('')
              setSourceInputValue('')
              setSourceError('')
            }}
            aria-label="Back to source options"
            type="button"
            variant="text"
            color="inherit"
            disableElevation
            disableRipple
            sx={{ minWidth: 0, padding: 0, textTransform: 'none' }}
          >
            <i className="material-icons" aria-hidden="true">arrow_back</i>
          </Button>

          <div className="upload-link-wrap">
            <i className="material-icons upload-label" aria-hidden="true">link</i>
            <input
              id="uploadLinkInput"
              className="upload-link-input input"
              placeholder={sourcePlaceholder}
              value={sourceInputValue}
              onChange={(event) => {
                setSourceInputValue(event.target.value)
                setSourceError('')
              }}
              aria-label="Source URL"
            />
            <Button
              className={`upload-go ${sourceInputValue.trim() ? 'active' : ''}`}
              aria-label="Use source"
              type="button"
              variant="text"
              color="inherit"
              disableElevation
              disableRipple
              sx={{ minWidth: 0, padding: 0, textTransform: 'none' }}
            >
              <i className="material-icons" aria-hidden="true">arrow_forward</i>
            </Button>
          </div>
          {sourceError ? <p className="upload-desc" style={{ top: 'auto', marginTop: 8, color: '#ffdddd' }}>{sourceError}</p> : null}
        </div>
      </div>

      <div
        id="upload2"
        className={`upload-page ${boundedStep === 2 ? 'active' : ''}`}
        style={{
          top: 0,
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: 20,
        }}
      >
        <h2
          id="uploadInformationTitle"
          className="upload-title"
          style={{
            position: 'static',
            left: 'auto',
            top: 'auto',
            transform: 'none',
            width: '100%',
            maxWidth: '690px',
            margin: '0 0 14px',
            padding: 0,
            textAlign: 'left',
            textShadow: 'none',
          }}
        >
          Video Information
        </h2>

        <Box
          className="upload-inputs"
          id="upload2Inputs"
          sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', float: 'none' }}
        >
          <Box
            id="uploadVideoTitlePrivacyRow"
            sx={{
              width: '100%',
              maxWidth: 690,
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              mb: 1,
            }}
          >
            <Box
              id="uploadInputTitle"
              className="upload-input upload-input-title"
              sx={{ ...step2InputWrapperSx, flex: { xs: '1 1 100%', sm: '1 1 auto' }, width: 'auto', float: 'none', mb: 0, minWidth: 0, ml: 0 }}
            >
              <TextField
                fullWidth
                value={formValues.title}
                onChange={handleChange('title')}
                placeholder="Title"
                error={Boolean(fieldErrors.title)}
                helperText={fieldErrors.title || 'Required'}
                FormHelperTextProps={helperTextNoShadowProps}
                variant="filled"
                sx={step2FieldSx}
                InputProps={{ disableUnderline: true }}
                inputProps={{ className: 'input', 'aria-label': 'Video title' }}
              />
            </Box>

            <Box
              className="upload-input upload-visibility"
              sx={{ ...step2InputWrapperSx, flex: { xs: '1 1 100%', sm: '0 0 180px' }, width: 'auto', float: 'none', mb: 0, minWidth: 0, ml: 0 }}
            >
              <TextField
                select
                fullWidth
                value={formValues.privacy}
                onChange={handleChange('privacy')}
                error={Boolean(fieldErrors.privacy)}
                helperText={fieldErrors.privacy || 'Privacy'}
                FormHelperTextProps={helperTextNoShadowProps}
                variant="filled"
                sx={step2FieldSx}
                InputProps={{ disableUnderline: true }}
                inputProps={{ className: 'input', 'aria-label': 'Video privacy' }}
              >
                {PRIVACY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          <Box
            id="uploadThumbAndChatRow"
            sx={{
              width: '100%',
              maxWidth: 690,
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              mb: 2,
            }}
          >
            <Box
              id="uploadThumbnailPicker"
              sx={{
                ...mediaDropZoneSx,
                backgroundColor: 'rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
              onClick={() => document.getElementById('uploadThumbnailFileInput')?.click()}
            >
              {thumbnailPreviewUrl ? (
                <img src={thumbnailPreviewUrl} alt="Thumbnail preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 4 }} />
              ) : (
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  {selectedFiles.thumbnail ? `Thumbnail: ${selectedFiles.thumbnail.name}` : 'Drop thumbnail here or click to select'}
                </Typography>
              )}
              <input
                id="uploadThumbnailFileInput"
                type="file"
                accept={THUMBNAIL_INPUT_ACCEPT}
                onChange={handleThumbnailInput}
                aria-label="Select thumbnail file"
                style={{ display: 'none' }}
              />
            </Box>

            <Box
              id="uploadInputChat"
              className="upload-input upload-input-desc"
              sx={{ ...step2InputWrapperSx, flex: 1, width: 'auto', marginTop: 0, float: 'none', mb: 0, ml: 0 }}
            >
              <TextField
                fullWidth
                value={formValues.discussion_link}
                onChange={handleChange('discussion_link')}
                placeholder="Paste Reddit discussion link (optional)"
                error={Boolean(fieldErrors.discussion_link)}
                helperText={fieldErrors.discussion_link || 'Optional'}
                FormHelperTextProps={helperTextNoShadowProps}
                variant="filled"
                sx={step2FieldSx}
                InputProps={{ disableUnderline: true }}
                inputProps={{ className: 'input', 'aria-label': 'Discussion link' }}
              />
            </Box>
          </Box>

          <div
            id="uploadInputDesc"
            className="upload-input upload-input-desc"
            style={{ ...step2InputWrapperSx, marginTop: 0 }}
          >
            <TextField
              fullWidth
              multiline
              minRows={4}
              value={formValues.description}
              onChange={handleChange('description')}
              placeholder="Description"
              error={Boolean(fieldErrors.description)}
              helperText={fieldErrors.description || 'Optional'}
              FormHelperTextProps={helperTextNoShadowProps}
              variant="filled"
              sx={step2DescriptionFieldSx}
              InputProps={{ disableUnderline: true }}
              inputProps={{ className: 'input', 'aria-label': 'Video description' }}
            />
          </div>
        </Box>

        <Box className="upload-toggles" sx={{ width: '100%', maxWidth: 690, mt: 1 }}>

          {fieldErrors.source_url ? <Typography className="field-error-text" sx={{ color: '#ffdddd', mb: 0.5 }}>{fieldErrors.source_url}</Typography> : null}
          {fieldErrors.thumbnail ? <Typography className="field-error-text" sx={{ color: '#ffdddd', mb: 0.5 }}>{fieldErrors.thumbnail}</Typography> : null}

          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
            Max thumbnail size: {formatBytes(MAX_THUMBNAIL_SIZE_BYTES)}
          </Typography>

          {isUploading ? (
            <Box sx={{ mt: 1.5 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          ) : null}
        </Box>
      </div>

      <div id="upload3" className={`upload-page ${boundedStep === 3 ? 'active' : ''}`}>
        <h2 className="upload-title">Upload Complete</h2>
        <p className="upload-desc">Your video has been submitted and is being processed.</p>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </section>
  )
})

export default Upload
