import { memo, useMemo, useState, useEffect } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useVideoUploadForm from '../hooks/useVideoUploadForm'
import LinkedAccountImport from './LinkedAccountImport'
import { isDropboxConnected, uploadToDropboxAndGetLink } from '../services/dropboxUploadService'
import { connectAccount } from '../services/linkedAccountService'
import {
  formatBytes,
  MAX_THUMBNAIL_SIZE_BYTES,
  THUMBNAIL_INPUT_ACCEPT,
} from '../config/upload.config'

const STORAGE_SYSTEMS = [
  {
    id: 'google_drive',
    name: 'Google Drive',
    icon: 'cloud_queue',
    totalSpace: '200 GB',
    usedSpace: '105.4 GB',
    freeSpace: '94.6 GB',
    usedPercent: 52.7,
    account: 'user@gmail.com',
    status: 'Connected',
    statusClass: 'connected',
    speed: '500 MB/s Stream Bridge',
    protocol: 'OAuth 2.0 API v3',
    color: '#4285F4',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: 'folder_shared',
    totalSpace: '100 GB',
    usedSpace: '42.8 GB',
    freeSpace: '57.2 GB',
    usedPercent: 42.8,
    account: 'user@dropbox.com',
    status: 'Connected',
    statusClass: 'connected',
    speed: '350 MB/s Chunk Sync',
    protocol: 'Dropbox API v2',
    color: '#0061FF',
  },
  {
    id: 'onedrive',
    name: 'Microsoft OneDrive',
    icon: 'cloud_done',
    totalSpace: '50 GB',
    usedSpace: '18.2 GB',
    freeSpace: '31.8 GB',
    usedPercent: 36.4,
    account: 'user@outlook.com',
    status: 'Ready',
    statusClass: 'ready',
    speed: '400 MB/s Graph Bridge',
    protocol: 'MS Graph API v1.0',
    color: '#0078D4',
  },
  {
    id: 'amazon_s3',
    name: 'Amazon S3',
    icon: 'dns',
    totalSpace: '5 TB',
    usedSpace: '1.2 TB',
    freeSpace: '3.8 TB',
    usedPercent: 24.0,
    account: 'us-east-1 (s3-vault)',
    status: 'Ready',
    statusClass: 'ready',
    speed: '1 GB/s Direct S3 Multipart',
    protocol: 'AWS S3 SDK',
    color: '#FF9900',
  },
  {
    id: 'mega',
    name: 'Mega Cloud',
    icon: 'lock',
    totalSpace: '20 GB',
    usedSpace: '15.0 GB',
    freeSpace: '5.0 GB',
    usedPercent: 75.0,
    account: 'user@mega.nz',
    status: 'Ready',
    statusClass: 'ready',
    speed: '250 MB/s Encrypted Stream',
    protocol: 'Mega E2EE Protocol',
    color: '#D9272E',
  },
  {
    id: 'box',
    name: 'Box Cloud',
    icon: 'inventory_2',
    totalSpace: '25 GB',
    usedSpace: '8.5 GB',
    freeSpace: '16.5 GB',
    usedPercent: 34.0,
    account: 'user@box.com',
    status: 'Ready',
    statusClass: 'ready',
    speed: '300 MB/s Enterprise Sync',
    protocol: 'Box Enterprise API',
    color: '#0061D5',
  },
  {
    id: 'cloudflare_r2',
    name: 'Cloudflare R2',
    icon: 'speed',
    totalSpace: '1 TB',
    usedSpace: '320 GB',
    freeSpace: '680 GB',
    usedPercent: 32.0,
    account: 'r2-video-vault',
    status: 'Active',
    statusClass: 'connected',
    speed: '800 MB/s Zero Egress',
    protocol: 'S3-Compatible Gateway',
    color: '#F38020',
  },
  {
    id: 'local_disk',
    name: 'Local Server Storage',
    icon: 'sd_card',
    totalSpace: '1 TB',
    usedSpace: '450 GB',
    freeSpace: '550 GB',
    usedPercent: 45.0,
    account: '/var/media/storage',
    status: 'Connected',
    statusClass: 'connected',
    speed: '2.5 GB/s Direct NVMe',
    protocol: 'Local Disk Buffer',
    color: '#03DAC6',
  },
]

const CATEGORY_OPTIONS = [
  'Entertainment',
  'Music',
  'Science & Technology',
  'Gaming',
  'Education',
  'Vlogs',
  'News & Politics',
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
  maxStep = 4,
  onHideUpload,
  onNextUpload,
  onPrevUpload,
  onVideoReady,
}) {
  const [currentWizardStep, setCurrentWizardStep] = useState(1)

  // Sync external step if passed
  useEffect(() => {
    if (step >= 1 && step <= 4) {
      setCurrentWizardStep(step)
    }
  }, [step])

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

  // Section 1 State: Storage Selection
  const [selectedStorage, setSelectedStorage] = useState('google_drive')

  // Section 2 State: Import Source
  const [sourceMode, setSourceMode] = useState('url') // 'url', 'file', 'connected'
  const [sourceUrlInput, setSourceUrlInput] = useState('')
  const [selectedLocalFile, setSelectedLocalFile] = useState(null)
  const [sourceError, setSourceError] = useState('')

  // Section 3 State: Metadata Editor
  const [videoTitle, setVideoTitle] = useState('')
  const [videoDesc, setVideoDesc] = useState('')
  const [videoCategory, setVideoCategory] = useState('Entertainment')
  const [videoPrivacy, setVideoPrivacy] = useState('public')
  const [tagsList, setTagsList] = useState(['video', 'creator', 'migration', 'octopussol'])
  const [newTagInput, setNewTagInput] = useState('')
  const [discussionLink, setDiscussionLink] = useState('')

  // Section 4 State: Migration Progress
  const [migrationProgress, setMigrationProgress] = useState(0)
  const [migrationLogs, setMigrationLogs] = useState([])
  const [migrationComplete, setMigrationComplete] = useState(false)
  const [migratedVideoData, setMigratedVideoData] = useState(null)

  const activeStorageInfo = useMemo(() => {
    return STORAGE_SYSTEMS.find((s) => s.id === selectedStorage) || STORAGE_SYSTEMS[0]
  }, [selectedStorage])

  const canGoPrev = currentWizardStep > 1 && !isUploading
  const canGoNext = currentWizardStep < 4 && !isUploading

  // Handler for adding new tag chip
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const trimmed = newTagInput.trim().replace(/^#/, '')
      if (trimmed && !tagsList.includes(trimmed)) {
        setTagsList([...tagsList, trimmed])
      }
      setNewTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTagsList(tagsList.filter((t) => t !== tagToRemove))
  }

  // Handle Step Advancement with Validation
  const handleNextStep = async () => {
    setSourceError('')

    // Step 1 -> Step 2
    if (currentWizardStep === 1) {
      if (!selectedStorage) {
        setSourceError('Please select a storage destination system.')
        return
      }
      setCurrentWizardStep(2)
      onNextUpload?.()
      return
    }

    // Step 2 -> Step 3
    if (currentWizardStep === 2) {
      if (sourceMode === 'url') {
        const trimmed = sourceUrlInput.trim()
        if (!trimmed) {
          setSourceError('Please enter a valid video or cloud source URL.')
          return
        }
        if (!isValidHttpUrl(trimmed)) {
          setSourceError('Source URL must be a valid http:// or https:// web address.')
          return
        }
        if (!videoTitle) {
          // Pre-populate title from URL or domain
          try {
            const parsed = new URL(trimmed)
            const cleanName = parsed.pathname.split('/').pop().replace(/\.[^/.]+$/, '') || 'Migrated Video'
            setVideoTitle(decodeURIComponent(cleanName.replace(/[-_]/g, ' ')))
          } catch {
            setVideoTitle('Migrated Video')
          }
        }
      } else if (sourceMode === 'file') {
        if (!selectedLocalFile) {
          setSourceError('Please select a video file from your local device.')
          return
        }
        if (!videoTitle) {
          const cleanName = selectedLocalFile.name.replace(/\.[^/.]+$/, '')
          setVideoTitle(cleanName)
        }
      }
      setCurrentWizardStep(3)
      onNextUpload?.()
      return
    }

    // Step 3 -> Step 4 (Start Migration)
    if (currentWizardStep === 3) {
      if (!videoTitle.trim()) {
        setSourceError('Video title is required.')
        return
      }
      setCurrentWizardStep(4)
      onNextUpload?.()
      startMigrationProcess()
      return
    }
  }

  const handlePrevStep = () => {
    if (currentWizardStep > 1 && !isUploading) {
      setCurrentWizardStep((prev) => prev - 1)
      onPrevUpload?.()
    }
  }

  // Live Migration Simulation in Step 4
  const startMigrationProcess = () => {
    setMigrationProgress(0)
    setMigrationComplete(false)
    setMigrationLogs([])

    const logs = [
      `[1/5] Initializing migration bridge to ${activeStorageInfo.name}...`,
      `[2/5] Establishing secure payload channel via ${activeStorageInfo.protocol}...`,
      `[3/5] Streaming & encoding video chunks (1080p @ 60fps)...`,
      `[4/5] Applying video metadata (${tagsList.length} tags, ${videoCategory})...`,
      `[5/5] Migration finished successfully! Registered video to channel.`,
    ]

    let currentLogIndex = 0
    const logTimer = setInterval(() => {
      if (currentLogIndex < logs.length) {
        const nextLog = logs[currentLogIndex]
        setMigrationLogs((prev) => [...prev, nextLog])
        setMigrationProgress((currentLogIndex + 1) * 20)
        currentLogIndex++
      } else {
        clearInterval(logTimer)
        setMigrationComplete(true)
        const generatedVideoId = `migrated-${Date.now().toString(36)}`
        const finalData = {
          videoId: generatedVideoId,
          title: videoTitle || 'Migrated Video',
          description: videoDesc,
          sourceType: activeStorageInfo.name,
          sourceUrl: sourceUrlInput || (selectedLocalFile ? selectedLocalFile.name : 'Cloud Stream'),
          storageLocation: activeStorageInfo.name,
        }
        setMigratedVideoData(finalData)
        if (typeof onVideoReady === 'function') {
          onVideoReady(finalData)
        }
      }
    }, 800)
  }

  return (
    <section
      id="upload"
      className={`upload ${active ? 'active' : ''}`}
      aria-label="Upload and migrate video"
      aria-hidden={!active}
      style={{ overflowY: 'auto', maxHeight: '100vh', paddingBottom: '40px' }}
    >
      {/* Floating Action Buttons matching Home Page style (.button-float active) */}
      <Button
        id="uploadClose"
        className="upload-close button-float active"
        onClick={() => onHideUpload?.()}
        aria-label="Close upload wizard"
        type="button"
        variant="text"
        color="inherit"
        disableElevation
        disableRipple
        style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}
      >
        <i className="material-icons" aria-hidden="true">close</i>
      </Button>

      <Button
        id="uploadNext"
        className={`upload-next button-float ${canGoNext ? 'active' : ''}`}
        onClick={handleNextStep}
        aria-label="Next step"
        type="button"
        variant="text"
        color="inherit"
        disableElevation
        disableRipple
        disabled={!canGoNext || isUploading}
        style={{ position: 'fixed', top: 20, right: 85, zIndex: 1000 }}
      >
        <i className="material-icons" aria-hidden="true">navigate_next</i>
      </Button>

      <Button
        id="uploadPrev"
        className={`upload-prev button-float ${canGoPrev ? 'active' : ''}`}
        onClick={handlePrevStep}
        aria-label="Previous step"
        type="button"
        variant="text"
        color="inherit"
        disableElevation
        disableRipple
        disabled={!canGoPrev || isUploading}
        style={{ position: 'fixed', top: 20, right: 150, zIndex: 1000 }}
      >
        <i className="material-icons" aria-hidden="true">navigate_before</i>
      </Button>

      <div className="post-wizard-container">
        {/* Step Indicator Navigation Bar */}
        <div className="post-step-indicator-bar">
          <div
            className={`post-step-item ${currentWizardStep === 1 ? 'active' : ''} ${currentWizardStep > 1 ? 'completed' : ''}`}
            onClick={() => currentWizardStep > 1 && setCurrentWizardStep(1)}
          >
            <div className="post-step-number">1</div>
            <span>1. Storage Selection</span>
          </div>

          <div
            className={`post-step-item ${currentWizardStep === 2 ? 'active' : ''} ${currentWizardStep > 2 ? 'completed' : ''}`}
            onClick={() => currentWizardStep > 2 && setCurrentWizardStep(2)}
          >
            <div className="post-step-number">2</div>
            <span>2. Import Source</span>
          </div>

          <div
            className={`post-step-item ${currentWizardStep === 3 ? 'active' : ''} ${currentWizardStep > 3 ? 'completed' : ''}`}
            onClick={() => currentWizardStep > 3 && setCurrentWizardStep(3)}
          >
            <div className="post-step-number">3</div>
            <span>3. Metadata Editor</span>
          </div>

          <div className={`post-step-item ${currentWizardStep === 4 ? 'active' : ''}`}>
            <div className="post-step-number">4</div>
            <span>4. Migration Progress</span>
          </div>
        </div>

        {sourceError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSourceError('')}>
            {sourceError}
          </Alert>
        )}

        {/* SECTION 1: STORAGE SELECTION (Codepen pLJqgE Inspired Design) */}
        {currentWizardStep === 1 && (
          <div className="post-step-content active">
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: '#ffffff' }}>
              Select Cloud Storage Destination
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
              Choose the cloud storage provider where your video will be imported, stored, and managed.
            </Typography>

            <div className="storage-card-grid">
              {STORAGE_SYSTEMS.map((system) => {
                const isSelected = selectedStorage === system.id
                return (
                  <div
                    key={system.id}
                    className={`storage-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedStorage(system.id)
                      setSourceError('')
                    }}
                  >
                    {/* Hover Info Popover displaying detailed storage info */}
                    <div className="storage-hover-info">
                      <div className="storage-hover-title">
                        <i className="material-icons" style={{ fontSize: 16 }}>info</i>
                        {system.name} Capacity
                      </div>
                      <div className="storage-hover-row">
                        <span>Total Storage:</span>
                        <strong>{system.totalSpace}</strong>
                      </div>
                      <div className="storage-hover-row">
                        <span>Used Space:</span>
                        <strong>{system.usedSpace} ({system.usedPercent}%)</strong>
                      </div>
                      <div className="storage-hover-row">
                        <span>Available Free:</span>
                        <strong>{system.freeSpace}</strong>
                      </div>
                      <div className="storage-hover-row">
                        <span>Account/Bucket:</span>
                        <strong>{system.account}</strong>
                      </div>
                      <div className="storage-hover-row">
                        <span>Transfer Rate:</span>
                        <strong>{system.speed}</strong>
                      </div>
                      <div className="storage-hover-row">
                        <span>Protocol:</span>
                        <strong>{system.protocol}</strong>
                      </div>
                    </div>

                    <div className="storage-card-top">
                      <div className="storage-icon-wrapper" style={{ color: system.color }}>
                        <i className="material-icons">{system.icon}</i>
                      </div>
                      <span className={`storage-card-badge ${system.statusClass}`}>
                        {system.status}
                      </span>
                    </div>

                    <div>
                      <div className="storage-card-name">{system.name}</div>
                      <div className="storage-card-details-sub">
                        <span>{system.usedSpace} used</span>
                        <span>{system.usedPercent}%</span>
                      </div>
                      <div className="storage-progress-track">
                        <div
                          className="storage-progress-bar"
                          style={{
                            width: `${system.usedPercent}%`,
                            backgroundColor: system.usedPercent > 80 ? '#f44336' : system.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <button
                type="button"
                className="button-flat"
                onClick={() => onHideUpload?.()}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button"
                onClick={handleNextStep}
              >
                Next: Import Source <i className="material-icons" style={{ fontSize: 18, marginLeft: 6 }}>arrow_forward</i>
              </button>
            </Box>
          </div>
        )}

        {/* SECTION 2: IMPORT SOURCE */}
        {currentWizardStep === 2 && (
          <div className="post-step-content active">
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: '#ffffff' }}>
              Import Source Selection
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
              Target Storage: <strong style={{ color: '#03dac6' }}>{activeStorageInfo.name}</strong> ({activeStorageInfo.account})
            </Typography>

            <div className="source-option-tabs">
              <button
                type="button"
                className={`source-tab-btn ${sourceMode === 'url' ? 'active' : ''}`}
                onClick={() => setSourceMode('url')}
              >
                <i className="material-icons">link</i> Direct Link / Cloud URL
              </button>
              <button
                type="button"
                className={`source-tab-btn ${sourceMode === 'file' ? 'active' : ''}`}
                onClick={() => setSourceMode('file')}
              >
                <i className="material-icons">file_upload</i> Upload Local File
              </button>
              <button
                type="button"
                className={`source-tab-btn ${sourceMode === 'connected' ? 'active' : ''}`}
                onClick={() => setSourceMode('connected')}
              >
                <i className="material-icons">sync_alt</i> Connected Accounts
              </button>
            </div>

            <Box sx={{ background: 'rgba(0,0,0,0.3)', p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
              {sourceMode === 'url' && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                    Paste Source Video URL (YouTube, Vimeo, Google Drive, MP4 Direct Link):
                  </Typography>
                  <input
                    type="url"
                    className="metadata-input"
                    placeholder="https://www.youtube.com/watch?v=... or https://drive.google.com/file/d/..."
                    value={sourceUrlInput}
                    onChange={(e) => {
                      setSourceUrlInput(e.target.value)
                      setSourceError('')
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1, display: 'block' }}>
                    Supported formats: MP4, WEBM, MOV, MKV, M3U8 Streams, YouTube, Google Drive, Dropbox links.
                  </Typography>
                </Box>
              )}

              {sourceMode === 'file' && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                    Select Video File from Local Disk:
                  </Typography>
                  <label style={{ display: 'block', padding: '30px', border: '2px dashed rgba(255,255,255,0.3)', borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}>
                    <i className="material-icons" style={{ fontSize: 40, color: '#03dac6', marginBottom: 8 }}>cloud_upload</i>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {selectedLocalFile ? selectedLocalFile.name : 'Click or Drag & Drop Video File Here'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Max size: 5 GB per video file
                    </Typography>
                    <input
                      type="file"
                      accept="video/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setSelectedLocalFile(e.target.files[0])
                          setSourceError('')
                        }
                      }}
                    />
                  </label>
                </Box>
              )}

              {sourceMode === 'connected' && (
                <Box>
                  <LinkedAccountImport
                    onSelectVideo={(video) => {
                      setSourceUrlInput(video.url || video.stream_url)
                      setVideoTitle(video.title)
                      setSourceError('')
                    }}
                  />
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 3 }}>
              <button
                type="button"
                className="button-flat"
                onClick={handlePrevStep}
              >
                <i className="material-icons" style={{ fontSize: 18, marginRight: 6 }}>arrow_back</i> Back to Storage
              </button>
              <button
                type="button"
                className="button"
                onClick={handleNextStep}
              >
                Next: Metadata Editor <i className="material-icons" style={{ fontSize: 18, marginLeft: 6 }}>arrow_forward</i>
              </button>
            </Box>
          </div>
        )}

        {/* SECTION 3: METADATA EDITOR */}
        {currentWizardStep === 3 && (
          <div className="post-step-content active">
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: '#ffffff' }}>
              Video Metadata Editor
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
              Configure video details, category, tags, and visibility before finalizing migration.
            </Typography>

            <div className="metadata-form-grid">
              <div className="metadata-field-group">
                <label>Video Title *</label>
                <input
                  type="text"
                  className="metadata-input"
                  placeholder="Enter video title..."
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
              </div>

              <div className="metadata-field-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  className="metadata-textarea"
                  placeholder="Tell viewers about your video..."
                  value={videoDesc}
                  onChange={(e) => setVideoDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="metadata-field-group">
                  <label>Category</label>
                  <select
                    className="metadata-select"
                    value={videoCategory}
                    onChange={(e) => setVideoCategory(e.target.value)}
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat} style={{ background: '#212121', color: '#fff' }}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="metadata-field-group">
                  <label>Visibility / Privacy</label>
                  <select
                    className="metadata-select"
                    value={videoPrivacy}
                    onChange={(e) => setVideoPrivacy(e.target.value)}
                  >
                    {PRIVACY_OPTIONS.map((priv) => (
                      <option key={priv.value} value={priv.value} style={{ background: '#212121', color: '#fff' }}>
                        {priv.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="metadata-field-group">
                <label>Tags (Press Enter or Comma to add)</label>
                <input
                  type="text"
                  className="metadata-input"
                  placeholder="Add tags (e.g. music, vlog, tutorial)..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
                <div className="tags-chip-list">
                  {tagsList.map((tag) => (
                    <span key={tag} className="tag-chip">
                      #{tag}
                      <span className="tag-chip-remove" onClick={() => handleRemoveTag(tag)}>×</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="metadata-field-group">
                <label>Reddit / Community Discussion Link (Optional)</label>
                <input
                  type="url"
                  className="metadata-input"
                  placeholder="https://reddit.com/r/..."
                  value={discussionLink}
                  onChange={(e) => setDiscussionLink(e.target.value)}
                />
              </div>
            </div>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 3 }}>
              <button
                type="button"
                className="button-flat"
                onClick={handlePrevStep}
              >
                <i className="material-icons" style={{ fontSize: 18, marginRight: 6 }}>arrow_back</i> Back to Source
              </button>
              <button
                type="button"
                className="button"
                onClick={handleNextStep}
              >
                Start Migration <i className="material-icons" style={{ fontSize: 18, marginLeft: 6 }}>cloud_upload</i>
              </button>
            </Box>
          </div>
        )}

        {/* SECTION 4: MIGRATION PROGRESS */}
        {currentWizardStep === 4 && (
          <div className="post-step-content active">
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: '#ffffff' }}>
              Migration Progress
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
              Migrating <strong style={{ color: '#03dac6' }}>{videoTitle}</strong> to {activeStorageInfo.name} ({activeStorageInfo.account}).
            </Typography>

            <div className="migration-dashboard">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {migrationComplete ? 'Migration Completed Successfully!' : 'Transferring payload...'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#03dac6' }}>
                  {migrationProgress}%
                </Typography>
              </Box>

              <div className="storage-progress-track" style={{ height: 12, marginBottom: 20 }}>
                <div
                  className="storage-progress-bar"
                  style={{
                    width: `${migrationProgress}%`,
                    background: migrationComplete ? '#03dac6' : 'linear-gradient(90deg, #673ab7, #03dac6)',
                  }}
                />
              </div>

              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
                Live Stream Bridge Terminal Log:
              </Typography>
              <div className="migration-status-console">
                {migrationLogs.map((log, index) => (
                  <div key={index} className={`console-line ${index === migrationLogs.length - 1 ? 'info' : 'success'}`}>
                    <i className="material-icons" style={{ fontSize: 14 }}>check_circle</i>
                    {log}
                  </div>
                ))}
              </div>

              {migrationComplete && (
                <Box sx={{ mt: 3, p: 2.5, background: 'rgba(3,218,198,0.12)', border: '1px solid rgba(3,218,198,0.3)', borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#03dac6', mb: 0.5 }}>
                    <i className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6 }}>verified</i>
                    Video Published to Channel & Cloud Vault
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mb: 2 }}>
                    Your video is ready for high-definition streaming and chunked cloud distribution.
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        if (migratedVideoData && typeof onVideoReady === 'function') {
                          onVideoReady(migratedVideoData)
                        } else {
                          onHideUpload?.()
                        }
                      }}
                    >
                      <i className="material-icons" style={{ fontSize: 18, marginRight: 6 }}>play_circle</i> Watch Video
                    </button>

                    <button
                      type="button"
                      className="button-flat"
                      onClick={() => {
                        setCurrentWizardStep(1)
                        setMigrationComplete(false)
                        setMigrationProgress(0)
                        setSourceUrlInput('')
                        setSelectedLocalFile(null)
                        setVideoTitle('')
                        setVideoDesc('')
                      }}
                    >
                      Migrate Another Video
                    </button>
                  </Box>
                </Box>
              )}
            </div>
          </div>
        )}
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
