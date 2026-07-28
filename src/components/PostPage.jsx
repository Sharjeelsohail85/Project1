import { memo, useCallback, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useVideoUploadForm from '../hooks/useVideoUploadForm'
import { isDropboxConnected, uploadToDropboxAndGetLink } from '../services/dropboxUploadService'
import { connectAccount, getConnectedAccounts } from '../services/linkedAccountService'
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

const PostPage = memo(function PostPage({ onClose, onVideoReady }) {
  const {
    formValues,
    setFormValues,
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

  const [selectedSource, setSelectedSource] = useState('uploadLink')
  const [sourceInputValue, setSourceInputValue] = useState('')
  const [sourceError, setSourceError] = useState('')
  const [selectedTags, setSelectedTags] = useState(['Music', 'Video', 'Creative'])
  const [tagInput, setTagInput] = useState('')

  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim()
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed])
      setTagInput('')
    }
  }, [tagInput, selectedTags])

  const handleRemoveTag = useCallback((tagToRemove) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagToRemove))
  }, [])

  const handleSubmitPost = async (e) => {
    e.preventDefault()
    setSourceError('')

    let resolvedSourceUrl = sourceInputValue.trim()
    if (!resolvedSourceUrl && selectedFiles.length === 0) {
      setSourceError('Please provide a video link or select a file.')
      return
    }

    const payload = {
      ...formValues,
      sourceUrl: resolvedSourceUrl,
      sourceType: selectedSource,
      tags: selectedTags,
    }

    const createdVideo = await submitUpload({
      sourceType: selectedSource,
      sourceUrl: resolvedSourceUrl,
      files: selectedFiles,
      values: payload,
    })

    if (createdVideo && onVideoReady) {
      onVideoReady(createdVideo)
    }
  }

  return (
    <section className="post-4cards-shell" aria-label="Post studio page">
      {/* Header Banner */}
      <div className="post-4cards-header">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="material-icons" style={{ color: '#ff4081' }}>video_call</i>
            Video Creation & Post Studio
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
            Publish new content to your channel in 4 simple section steps.
          </Typography>
        </div>
        {onClose && (
          <Button variant="outlined" color="inherit" onClick={onClose} size="small" sx={{ borderColor: 'rgba(255,255,255,0.3)' }}>
            Close Studio
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmitPost}>
        <div className="post-4cards-grid">
          {/* SECTION 1 CARD: MEDIA & SOURCE */}
          <div className="post-card-section">
            <div className="post-card-header">
              <span className="post-card-number">1</span>
              <h3 className="post-card-title">Select Video Source</h3>
            </div>

            <Typography variant="body2" color="text.secondary">
              Choose your media platform or paste a video link directly.
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 1 }}>
              {SOURCE_OPTIONS.map((source) => (
                <Button
                  key={source.id}
                  variant={selectedSource === source.id ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setSelectedSource(source.id)}
                  startIcon={<i className="material-icons">{source.icon}</i>}
                  sx={{
                    borderRadius: '20px',
                    textTransform: 'none',
                    bgcolor: selectedSource === source.id ? 'var(--theme-color, #673ab7)' : 'transparent',
                  }}
                >
                  {source.label}
                </Button>
              ))}
            </Box>

            <TextField
              label="Video URL / Media Link"
              variant="outlined"
              size="small"
              fullWidth
              value={sourceInputValue}
              onChange={(e) => setSourceInputValue(e.target.value)}
              placeholder="https://example.com/video.mp4 or YouTube / Drive link"
              error={Boolean(sourceError)}
              helperText={sourceError || 'Direct MP4, YouTube, Drive, or Dropbox links supported'}
            />

            {sourceInputValue && (
              <Box sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                  LIVE MEDIA PREVIEW:
                </Typography>
                <video
                  src={sourceInputValue}
                  controls
                  style={{ width: '100%', maxHeight: 180, borderRadius: 8, background: '#000' }}
                  onError={() => {}}
                />
              </Box>
            )}
          </div>

          {/* SECTION 2 CARD: METADATA & DETAILS */}
          <div className="post-card-section">
            <div className="post-card-header">
              <span className="post-card-number">2</span>
              <h3 className="post-card-title">Video Information</h3>
            </div>

            <TextField
              label="Video Title"
              name="title"
              variant="outlined"
              size="small"
              required
              fullWidth
              value={formValues.title}
              onChange={handleChange}
              error={Boolean(fieldErrors.title)}
              helperText={fieldErrors.title || `${formValues.title.length}/100 characters`}
              inputProps={{ maxLength: 100 }}
            />

            <TextField
              label="Description"
              name="description"
              variant="outlined"
              size="small"
              multiline
              rows={3}
              fullWidth
              value={formValues.description}
              onChange={handleChange}
              placeholder="Tell viewers about your video..."
            />

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                Topic Tags:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  sx={{ flexGrow: 1 }}
                />
                <Button variant="outlined" size="small" onClick={handleAddTag}>
                  Add
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: 'rgba(103, 58, 183, 0.12)',
                      color: 'var(--theme-color, #673ab7)',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    #{tag}
                    <i
                      className="material-icons"
                      style={{ fontSize: '14px', cursor: 'pointer' }}
                      onClick={() => handleRemoveTag(tag)}
                    >
                      close
                    </i>
                  </span>
                ))}
              </Box>
            </Box>
          </div>

          {/* SECTION 3 CARD: THUMBNAIL MEDIA */}
          <div className="post-card-section">
            <div className="post-card-header">
              <span className="post-card-number">3</span>
              <h3 className="post-card-title">Thumbnail Cover</h3>
            </div>

            <Typography variant="body2" color="text.secondary">
              Upload an eye-catching thumbnail image (max 5MB).
            </Typography>

            <Button
              variant="outlined"
              component="label"
              startIcon={<i className="material-icons">image</i>}
              sx={{ textTransform: 'none' }}
            >
              Choose Thumbnail Image
              <input
                type="file"
                hidden
                accept={THUMBNAIL_INPUT_ACCEPT}
                onChange={handleThumbnailInput}
              />
            </Button>

            {thumbnailPreviewUrl ? (
              <Box sx={{ mt: 1, textCenter: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Thumbnail Preview:
                </Typography>
                <img
                  src={thumbnailPreviewUrl}
                  alt="Thumbnail Preview"
                  style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8 }}
                />
              </Box>
            ) : (
              <Box sx={{ p: 3, border: '2px dashed #cbd5e1', borderRadius: 2, textAlign: 'center', color: '#64748b' }}>
                <i className="material-icons" style={{ fontSize: 36, opacity: 0.6 }}>photo_library</i>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  No thumbnail uploaded. Standard auto-preview will be generated.
                </Typography>
              </Box>
            )}
          </div>

          {/* SECTION 4 CARD: PRIVACY & PUBLISHING */}
          <div className="post-card-section">
            <div className="post-card-header">
              <span className="post-card-number">4</span>
              <h3 className="post-card-title">Publish & Privacy</h3>
            </div>

            <TextField
              select
              label="Privacy Option"
              name="privacy"
              size="small"
              fullWidth
              value={formValues.privacy}
              onChange={handleChange}
            >
              {PRIVACY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Discussion / Forum Link (Optional)"
              name="discussion_link"
              size="small"
              fullWidth
              value={formValues.discussion_link}
              onChange={handleChange}
              placeholder="https://..."
            />

            {isUploading && (
              <Box sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Publishing video... {uploadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 8, borderRadius: 4, mt: 0.5 }} />
              </Box>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isUploading}
              startIcon={<i className="material-icons">publish</i>}
              sx={{
                bgcolor: 'var(--theme-color, #673ab7)',
                color: '#fff',
                py: 1.5,
                fontWeight: 700,
                fontSize: '16px',
                borderRadius: '12px',
                mt: 'auto',
                boxShadow: '0 4px 14px rgba(103, 58, 183, 0.4)',
              }}
            >
              {isUploading ? 'Publishing Video...' : 'Publish Video Now'}
            </Button>
          </div>
        </div>
      </form>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </section>
  )
})

export default PostPage
