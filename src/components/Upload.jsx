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
  MAX_VIDEO_SIZE_BYTES,
  THUMBNAIL_INPUT_ACCEPT,
  VIDEO_INPUT_ACCEPT,
} from '../config/upload.config'

const SOURCE_OPTIONS = [
  { id: 'uploadLink', icon: 'link', label: 'Paste a Link' },
  { id: 'uploadYoutube', icon: 'smart_display', label: 'YouTube' },
  { id: 'uploadFacebook', icon: 'facebook', label: 'Facebook' },
]

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'unlisted', label: 'Unlisted' },
]

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

const Upload = memo(function Upload({
  active,
  step = 1,
  minStep = 1,
  maxStep = 3,
  onHideUpload,
  onNextUpload,
  onPrevUpload,
}) {
  const {
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

  const sourcePlaceholder = useMemo(() => {
    if (selectedSource === 'uploadYoutube') return 'Paste YouTube URL'
    if (selectedSource === 'uploadFacebook') return 'Paste Facebook URL'
    return 'Paste video URL'
  }, [selectedSource])

  const handleNext = async () => {
    if (!canGoNext || isUploading) return

    if (boundedStep === 2) {
      const result = await submitUpload()
      if (!result) return
    }

    onNextUpload?.()
  }

  const handlePrev = () => {
    if (!canGoPrev || isUploading) return
    onPrevUpload?.()
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
        sx={{ minWidth: 0, padding: 0, textTransform: 'none' }}
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
        sx={{ minWidth: 0, padding: 0, textTransform: 'none' }}
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
        sx={{ minWidth: 0, padding: 0, textTransform: 'none' }}
      >
        <i className="material-icons" aria-hidden="true">navigate_before</i>
      </Button>

      <div className="signup-progress upload-progress" aria-hidden="true">
        <div id="uploadProgressBar" className="signup-progress-bar" style={{ width: progressWidth }} />
      </div>

      <div id="upload1" className={`upload-page ${boundedStep === 1 ? 'active' : ''}`}>
        <h2 className="upload-title">Post a Video</h2>
        <p className="upload-desc">Choose how you want to share your content.</p>

        {SOURCE_OPTIONS.map((source) => (
          <Button
            key={source.id}
            id={source.id}
            className="upload-item-select"
            onClick={() => {
              setSelectedSource(source.id)
              setSourceInputValue('')
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
              onChange={(event) => setSourceInputValue(event.target.value)}
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
        </div>
      </div>

      <div id="upload2" className={`upload-page ${boundedStep === 2 ? 'active' : ''}`}>
        <h2 id="uploadInformationTitle" className="upload-title">Video Information</h2>

        <div className="upload-inputs" id="upload2Inputs">
          <div id="uploadInputTitle" className="upload-input upload-input-title">
            <TextField
              fullWidth
              value={formValues.title}
              onChange={handleChange('title')}
              placeholder="Title"
              error={Boolean(fieldErrors.title)}
              helperText={fieldErrors.title || 'Required'}
              variant="filled"
              InputProps={{ disableUnderline: true }}
              inputProps={{ className: 'input', 'aria-label': 'Video title' }}
            />
          </div>

          <div className="upload-input upload-visibility">
            <TextField
              select
              fullWidth
              value={formValues.privacy}
              onChange={handleChange('privacy')}
              error={Boolean(fieldErrors.privacy)}
              helperText={fieldErrors.privacy || 'Privacy'}
              variant="filled"
              InputProps={{ disableUnderline: true }}
              inputProps={{ className: 'input', 'aria-label': 'Video privacy' }}
            >
              {PRIVACY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          </div>

          <div id="uploadInputChat" className="upload-input upload-input-desc">
            <TextField
              fullWidth
              value={formValues.discussion_link}
              onChange={handleChange('discussion_link')}
              placeholder="Link to a Discussion Page (i.e. reddit)"
              error={Boolean(fieldErrors.discussion_link)}
              helperText={fieldErrors.discussion_link || 'Optional'}
              variant="filled"
              InputProps={{ disableUnderline: true }}
              inputProps={{ className: 'input', 'aria-label': 'Discussion link' }}
            />
          </div>

          <div id="uploadInputDesc" className="upload-input upload-input-desc">
            <TextField
              fullWidth
              multiline
              minRows={4}
              value={formValues.description}
              onChange={handleChange('description')}
              placeholder="Description"
              error={Boolean(fieldErrors.description)}
              helperText={fieldErrors.description || 'Optional'}
              variant="filled"
              InputProps={{ disableUnderline: true }}
              inputProps={{ className: 'input', 'aria-label': 'Video description' }}
            />
          </div>
        </div>

        <Box className="upload-toggles" sx={{ width: '100%', maxWidth: 690, mt: 1 }}>
          <Box
            id="uploadVideoDropZone"
            className={`upload-frame ${isVideoDragActive ? 'active' : ''}`}
            onDragEnter={handleVideoDragEnter}
            onDragOver={handleVideoDragOver}
            onDragLeave={handleVideoDragLeave}
            onDrop={handleVideoDrop}
            sx={{
              width: '100%',
              minHeight: 120,
              border: '2px dashed rgba(255,255,255,0.45)',
              borderRadius: 1,
              p: 2,
              mb: 1.5,
              cursor: 'pointer',
              backgroundColor: isVideoDragActive ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
            }}
            onClick={() => document.getElementById('uploadVideoFileInput')?.click()}
          >
            <Typography variant="body2" sx={{ color: '#fff' }}>
              {selectedFiles.video ? `Video: ${selectedFiles.video.name}` : 'Drop video here or click to select'}
            </Typography>
            <input
              id="uploadVideoFileInput"
              type="file"
              accept={VIDEO_INPUT_ACCEPT}
              onChange={handleVideoInput}
              aria-label="Select video file"
              style={{ display: 'none' }}
            />
          </Box>

          <Box
            id="uploadThumbnailPicker"
            sx={{
              width: '100%',
              minHeight: 120,
              border: '2px dashed rgba(255,255,255,0.35)',
              borderRadius: 1,
              p: 2,
              mb: 1,
              cursor: 'pointer',
              backgroundColor: 'rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => document.getElementById('uploadThumbnailFileInput')?.click()}
          >
            {thumbnailPreviewUrl ? (
              <img src={thumbnailPreviewUrl} alt="Thumbnail preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 4 }} />
            ) : (
              <Typography variant="body2" sx={{ color: '#fff' }}>
                {selectedFiles.thumbnail ? `Thumbnail: ${selectedFiles.thumbnail.name}` : 'Choose thumbnail (optional)'}
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

          {fieldErrors.video ? <Typography className="field-error-text" sx={{ color: '#ffdddd', mb: 0.5 }}>{fieldErrors.video}</Typography> : null}
          {fieldErrors.thumbnail ? <Typography className="field-error-text" sx={{ color: '#ffdddd', mb: 0.5 }}>{fieldErrors.thumbnail}</Typography> : null}

          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
            Max video size: {formatBytes(MAX_VIDEO_SIZE_BYTES)} · Max thumbnail size: {formatBytes(MAX_THUMBNAIL_SIZE_BYTES)}
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
