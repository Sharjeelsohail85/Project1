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
import LinkedAccountImport from './LinkedAccountImport'
import { isDropboxConnected, uploadToDropboxAndGetLink } from '../services/dropboxUploadService'
import { connectAccount, disconnectAccount, getConnectedAccounts, saveConnectedAccounts } from '../services/linkedAccountService'
import { connectOneDriveWithImplicitToken, uploadLocalFileToOneDrive, getOneDriveClientId, getOneDriveTenantId } from '../services/onedriveService'
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
  { id: 'uploadOneDrive', icon: 'cloud_done', label: 'Microsoft OneDrive' },
]

const LINKED_ACCOUNT_SOURCE = { id: 'importLinked', icon: 'sync_alt', label: 'Linked Accounts' }

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
  const [dropboxTab, setDropboxTab] = useState('browse')

  const [dropboxConnected, setDropboxConnected] = useState(() => isDropboxConnected())
  const [dropboxLocalFile, setDropboxLocalFile] = useState(null)
  const [isDropboxUploading, setIsDropboxUploading] = useState(false)
  const [dropboxProgress, setDropboxProgress] = useState(0)
  const [manualToken, setManualToken] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)

  const [onedriveTab, setOnedriveTab] = useState('browse')
  const [onedriveConnected, setOnedriveConnected] = useState(() => {
    try {
      const raw = localStorage.getItem('connected_accounts')
      const accounts = raw ? JSON.parse(raw) : []
      return accounts.some(a => a.provider === 'onedrive' && a.connected)
    } catch {
      return false
    }
  })
  const [onedriveLocalFile, setOnedriveLocalFile] = useState(null)
  const [isOneDriveUploading, setIsOneDriveUploading] = useState(false)
  const [onedriveProgress, setOnedriveProgress] = useState(0)
  const [onedriveManualTokenState, setOnedriveManualTokenState] = useState('')
  const [showOneDriveManualInput, setShowOneDriveManualInput] = useState(false)
  const [onedriveAccountType, setOnedriveAccountType] = useState('personal')
  const [onedriveCustomClientId, setOnedriveCustomClientId] = useState(() => getOneDriveClientId())
  const [onedriveCustomTenantId, setOnedriveCustomTenantId] = useState(() => getOneDriveTenantId())

  const getOneDriveTokenSafe = () => {
    try {
      const accounts = getConnectedAccounts()
      const acc = accounts.find(a => a.provider === 'onedrive' && a.connected)
      return acc?.user?.onedrive_access_token || acc?.user?.access_token || ''
    } catch {
      return ''
    }
  }

  const sourcePlaceholder = useMemo(() => {
    if (selectedSource === 'uploadGoogle') return 'Paste Google Drive URL'
    if (selectedSource === 'uploadYoutube') return 'Paste YouTube URL'
    if (selectedSource === 'uploadFacebook') return 'Paste Facebook URL'
    if (selectedSource === 'uploadDropbox') return 'Paste Dropbox URL'
    if (selectedSource === 'uploadOneDrive') return 'Paste OneDrive URL'
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

    // Linked Accounts panel: user must import a video first
    if (selectedSource === LINKED_ACCOUNT_SOURCE.id) {
      setSourceError('Import a video from your connected account first.')
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
    if (!canGoNext || isUploading || isDropboxUploading || isOneDriveUploading) return

    if (boundedStep === 1) {
      // If still on linked accounts panel, show error instead of proceeding
      if (selectedSource === LINKED_ACCOUNT_SOURCE.id) {
        setSourceError('Import a video from your connected account first, or select a different source.')
        return
      }

      if (selectedSource === 'uploadOneDrive' && onedriveLocalFile) {
        setIsOneDriveUploading(true)
        setOnedriveProgress(0)
        setSourceError('')
        try {
          const token = getOneDriveTokenSafe()
          if (!token) {
            throw new Error('OneDrive is not connected. Please connect your OneDrive account first.')
          }
          const result = await uploadLocalFileToOneDrive({
            file: onedriveLocalFile,
            accessToken: token,
            onProgress: setOnedriveProgress,
          })
          if (!result?.downloadUrl) {
            throw new Error('Failed to retrieve streaming link from OneDrive upload.')
          }
          setSourceInputValue(result.downloadUrl)
          if (!formValues.title) {
            const cleanTitle = onedriveLocalFile.name.replace(/\.[^/.]+$/, "")
            setFormValues((prev) => ({
              ...prev,
              title: cleanTitle,
            }))
          }
        } catch (err) {
          const errStr = String(err?.message || '')
          const isSPO = errStr.includes('SPO') || errStr.includes('license') || errStr.includes('Tenant does not have a SPO license')
          const isExpired = errStr.toLowerCase().includes('expired') || errStr.toLowerCase().includes('lifetime validation') || errStr.toLowerCase().includes('unauthorized')

          if (isSPO || isExpired) {
            if (isExpired) {
              // Disconnect OneDrive in localStorage
              try {
                const raw = localStorage.getItem('connected_accounts')
                const accounts = raw ? JSON.parse(raw) : []
                const filtered = accounts.map(acc => {
                  if (acc.provider === 'onedrive') {
                    return { ...acc, connected: false }
                  }
                  return acc
                })
                localStorage.setItem('connected_accounts', JSON.stringify(filtered))
                window.dispatchEvent(new CustomEvent('accounts:updated'))
              } catch (e) {
                console.error(e)
              }
            }

            const localBlobUrl = URL.createObjectURL(onedriveLocalFile)
            setSourceInputValue(localBlobUrl)
            
            if (!formValues.title) {
              const cleanTitle = onedriveLocalFile.name.replace(/\.[^/.]+$/, "")
              setFormValues((prev) => ({
                ...prev,
                title: cleanTitle,
              }))
            }

            setSourceError(isExpired 
              ? 'OneDrive session expired. Automatically routed upload via high-performance client-side fallback.' 
              : 'OneDrive licensing restriction detected. Automatically routed upload via high-performance client-side fallback.'
            )
            setIsOneDriveUploading(false)
            // Proceed to the metadata section since upload succeeded via fallback!
            onNextUpload?.()
            return
          }

          setSourceError(err.message || 'Failed to upload to OneDrive.')
          setIsOneDriveUploading(false)
          return
        }
        setIsOneDriveUploading(false)
      } else if (selectedSource === 'uploadDropbox' && dropboxLocalFile) {
        setIsDropboxUploading(true)
        setDropboxProgress(0)
        setSourceError('')
        try {
          const sharedUrl = await uploadToDropboxAndGetLink(dropboxLocalFile, setDropboxProgress)
          setSourceInputValue(sharedUrl)
          if (!formValues.title) {
            const cleanTitle = dropboxLocalFile.name.replace(/\.[^/.]+$/, "")
            setFormValues((prev) => ({
              ...prev,
              title: cleanTitle,
            }))
          }
        } catch (err) {
          setSourceError(err.message || 'Failed to upload to Dropbox.')
          setIsDropboxUploading(false)
          return
        }
        setIsDropboxUploading(false)
      } else {
        if (!validateSourceInput()) return
      }

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
          description: formValues.description.trim(),
          discussionLink: formValues.discussion_link.trim(),
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

        <div className="upload-item-select-divider" />

        <Button
          id={LINKED_ACCOUNT_SOURCE.id}
          className={`upload-item-select linked-account-select ${selectedSource === LINKED_ACCOUNT_SOURCE.id ? 'active' : ''}`}
          onClick={() => {
            if (selectedSource === LINKED_ACCOUNT_SOURCE.id) {
              setSelectedSource('')
            } else {
              setSelectedSource(LINKED_ACCOUNT_SOURCE.id)
              setSourceInputValue('')
              setSourceError('')
            }
          }}
          aria-label={LINKED_ACCOUNT_SOURCE.label}
          type="button"
          variant="text"
          color="inherit"
          disableElevation
          disableRipple
          sx={{ minWidth: 0, padding: 0, textTransform: 'none' }}
        >
          <i className="material-icons" aria-hidden="true">{LINKED_ACCOUNT_SOURCE.icon}</i>
        </Button>

        <div id="uploadLinkBox" className={`upload-link ${selectedSource && selectedSource !== LINKED_ACCOUNT_SOURCE.id ? 'active' : ''}`} style={['uploadDropbox', 'uploadGoogle', 'uploadOneDrive'].includes(selectedSource) ? { height: 'auto', maxHeight: '480px', overflowY: 'auto', padding: '16px' } : undefined}>
          <Button
            className="upload-link-back"
            onClick={() => {
              setSelectedSource('')
              setSourceInputValue('')
              setSourceError('')
              setDropboxLocalFile(null)
              setIsDropboxUploading(false)
              setDropboxProgress(0)
              setOnedriveLocalFile(null)
              setIsOneDriveUploading(false)
              setOnedriveProgress(0)
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

          {selectedSource === 'uploadGoogle' ? (
            <div className="google-drive-container" style={{ width: '100%', maxWidth: '600px', margin: '0 auto', textAlign: 'center', color: '#fff' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <i className="material-icons" style={{ color: '#4285F4' }}>cloud_queue</i> Google Drive Connection
              </h3>
              
              <LinkedAccountImport
                singleProvider="google"
                onSelectVideo={(video) => {
                  setSelectedSource('uploadLink')
                  setSourceInputValue(video.sourceUrl)
                  setSourceError('')
                  if (video.title) {
                    setFormValues(prev => ({
                      ...prev,
                      title: video.title,
                    }))
                  }
                }}
                onError={(msg) => {
                  setSourceError(msg)
                }}
              />

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', textAlign: 'center' }}>
                  — OR —
                </p>
                <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '8px', textAlign: 'center' }}>
                  Paste a direct Google Drive link:
                </p>
                <div className="upload-link-wrap" style={{ margin: '0 auto', maxWidth: '480px' }}>
                  <i className="material-icons upload-label" aria-hidden="true">link</i>
                  <input
                    id="uploadLinkInput"
                    className="upload-link-input input"
                    placeholder="Paste Google Drive shared link..."
                    value={sourceInputValue}
                    onChange={(event) => {
                      setSourceInputValue(event.target.value)
                      setSourceError('')
                    }}
                    aria-label="Source URL"
                  />
                </div>
              </div>
            </div>
          ) : selectedSource === 'uploadDropbox' ? (
            <div className="dropbox-upload-container" style={{ width: '100%', maxWidth: '600px', margin: '0 auto', textAlign: 'center', color: '#fff' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <i className="material-icons" style={{ color: '#0061FF' }}>folder_shared</i> Dropbox Connection
              </h3>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                <Button
                  variant={dropboxTab === 'browse' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setDropboxTab('browse')}
                  sx={{ textTransform: 'none', fontSize: '0.8rem', borderColor: '#0061FF', bgcolor: dropboxTab === 'browse' ? '#0061FF' : 'transparent', color: '#fff', '&:hover': { bgcolor: dropboxTab === 'browse' ? '#0052D4' : 'rgba(255,255,255,0.05)' } }}
                >
                  Browse Existing Videos
                </Button>
                <Button
                  variant={dropboxTab === 'upload' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setDropboxTab('upload')}
                  sx={{ textTransform: 'none', fontSize: '0.8rem', borderColor: '#0061FF', bgcolor: dropboxTab === 'upload' ? '#0061FF' : 'transparent', color: '#fff', '&:hover': { bgcolor: dropboxTab === 'upload' ? '#0052D4' : 'rgba(255,255,255,0.05)' } }}
                >
                  Upload Local Video
                </Button>
              </div>
              
              {dropboxTab === 'browse' ? (
                <LinkedAccountImport
                  singleProvider="dropbox"
                  onSelectVideo={(video) => {
                    setSelectedSource('uploadLink')
                    setSourceInputValue(video.sourceUrl)
                    setSourceError('')
                    if (video.title) {
                      setFormValues(prev => ({
                        ...prev,
                        title: video.title,
                      }))
                    }
                  }}
                  onError={(msg) => {
                    setSourceError(msg)
                  }}
                />
              ) : (
                <>
                  {dropboxConnected ? (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)', marginBottom: '16px' }}>
                      {!isDropboxUploading ? (
                        <div>
                          <p style={{ fontSize: '0.9rem', marginBottom: '12px', opacity: 0.8 }}>
                            Drag &amp; drop a video file or click below to select a video to upload directly to your connected Dropbox.
                          </p>
                          
                          <input
                            type="file"
                            accept="video/*"
                            id="dropbox-file-input"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null
                              setDropboxLocalFile(file)
                              setSourceError('')
                            }}
                          />
                          
                          {dropboxLocalFile ? (
                            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                                🎥 {dropboxLocalFile.name} ({formatBytes(dropboxLocalFile.size)})
                              </span>
                              <Button 
                                onClick={() => setDropboxLocalFile(null)} 
                                sx={{ minWidth: 0, color: '#ff5252', textTransform: 'none', fontSize: '0.8rem' }}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={() => document.getElementById('dropbox-file-input')?.click()}
                              sx={{ textTransform: 'none', borderColor: '#0061FF', color: '#fafafa', '&:hover': { borderColor: '#0052D4' } }}
                            >
                              Select Video File
                            </Button>
                          )}

                          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <Button
                              variant="text"
                              onClick={() => {
                                disconnectAccount('dropbox')
                                setDropboxConnected(false)
                                setDropboxLocalFile(null)
                              }}
                              sx={{ textTransform: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', '&:hover': { color: '#ff5252' } }}
                            >
                              Disconnect / Change Dropbox Account
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                          <p style={{ fontSize: '0.9rem', marginBottom: '12px' }}>
                            Uploading video to Dropbox... Please do not close this window.
                          </p>
                          <LinearProgress variant="determinate" value={dropboxProgress} style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#0061FF' }} />
                          <span style={{ display: 'block', marginTop: '8px', fontSize: '0.8rem', opacity: 0.7 }}>
                            {dropboxProgress}% completed
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                      <p style={{ fontSize: '0.9rem', marginBottom: '12px', opacity: 0.8 }}>
                        Connect your Dropbox account to upload local video files directly from your computer.
                      </p>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px', justifyContent: 'center' }}>
                        <Button
                          variant="contained"
                          onClick={async () => {
                            setSourceError('')
                            try {
                              await connectAccount('dropbox')
                              setDropboxConnected(true)
                            } catch (err) {
                              setSourceError(err.message || 'Failed to connect Dropbox.')
                            }
                          }}
                          sx={{ textTransform: 'none', background: '#0061FF', color: '#fff', '&:hover': { background: '#004ecb' } }}
                        >
                          Connect Dropbox Account
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setShowManualInput(prev => !prev)
                            setSourceError('')
                          }}
                          sx={{ textTransform: 'none', color: '#fff', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: '#fff', background: 'rgba(255,255,255,0.1)' } }}
                        >
                          {showManualInput ? 'Hide Token Entry' : 'Use Access Token / CLI Token'}
                        </Button>
                      </div>

                      {showManualInput && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '8px', textAlign: 'left' }}>
                            If you encounter a <strong>user limit</strong> error on the login popup, you can bypass it completely by pasting a <strong>Personal Access Token</strong> (used by CLI tools like <code>dbxcli</code>) from your Dropbox Developer Console:
                          </p>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <input
                              type="password"
                              placeholder="Paste Dropbox Personal Access Token..."
                              value={manualToken}
                              onChange={(e) => setManualToken(e.target.value)}
                              className="input"
                              style={{
                                flex: 1,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '4px',
                                color: '#fff',
                                padding: '6px 12px',
                                fontSize: '0.85rem'
                              }}
                            />
                            <Button
                              variant="contained"
                              onClick={async () => {
                                if (!manualToken.trim()) {
                                  setSourceError('Please enter a valid token.')
                                  return
                                }
                                try {
                                  const accounts = getConnectedAccounts()
                                  const newAccount = {
                                    provider: 'dropbox',
                                    connected: true,
                                    user: {
                                      uuid: `dropbox-user-manual-${Date.now()}`,
                                      first_name: 'Dropbox',
                                      last_name: 'User (Manual)',
                                      email: `dropbox.${Date.now()}@manual.local`,
                                      registration_type: 'dropbox',
                                      active: 1,
                                      dropbox_access_token: manualToken.trim(),
                                      access_token: manualToken.trim(),
                                    }
                                  }
                                  const filtered = accounts.filter(a => a.provider !== 'dropbox')
                                  filtered.push(newAccount)
                                  saveConnectedAccounts(filtered)
                                  setDropboxConnected(true)
                                  setManualToken('')
                                  setShowManualInput(false)
                                } catch (err) {
                                  setSourceError('Failed to save manual token: ' + err.message)
                                }
                              }}
                              sx={{ textTransform: 'none', background: '#2e7d32', color: '#fff', '&:hover': { background: '#1b5e20' } }}
                            >
                              Connect Token
                            </Button>
                          </div>
                          <p style={{ fontSize: '0.75rem', opacity: 0.6, textAlign: 'left', lineHeight: '1.4' }}>
                            💡 <strong>How to get this?</strong><br />
                            1. Go to the <a href="https://www.dropbox.com/developers/apps" target="_blank" rel="noreferrer" style={{ color: '#0061FF', textDecoration: 'underline' }}>Dropbox App Console</a>.<br />
                            2. Click your App name (or create a temporary personal app with Scopes: <code>files.metadata.read</code>, <code>files.content.read</code>, <code>files.content.write</code>, <code>sharing.write</code>, <code>sharing.read</code>).<br />
                            3. Scroll down to the <strong>Generated access token</strong> section, and click <strong>Generate</strong>. Copy and paste it here.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {!isDropboxUploading && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '8px' }}>
                    — OR —
                  </p>
                  <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '8px' }}>
                    Paste a direct shared link from Dropbox:
                  </p>
                  <div className="upload-link-wrap" style={{ margin: '0 auto', maxWidth: '480px' }}>
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
                      disabled={Boolean(dropboxLocalFile)}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : selectedSource === 'uploadOneDrive' ? (
            <div className="onedrive-upload-container" style={{ width: '100%', maxWidth: '600px', margin: '0 auto', textAlign: 'center', color: '#fff' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <i className="material-icons" style={{ color: '#0078d4' }}>cloud_done</i> Microsoft OneDrive Connection
              </h3>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                <Button
                  variant={onedriveTab === 'browse' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setOnedriveTab('browse')}
                  sx={{ textTransform: 'none', fontSize: '0.8rem', borderColor: '#0078d4', bgcolor: onedriveTab === 'browse' ? '#0078d4' : 'transparent', color: '#fff', '&:hover': { bgcolor: onedriveTab === 'browse' ? '#005ca5' : 'rgba(255,255,255,0.05)' } }}
                >
                  Browse Existing Videos
                </Button>
                <Button
                  variant={onedriveTab === 'upload' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setOnedriveTab('upload')}
                  sx={{ textTransform: 'none', fontSize: '0.8rem', borderColor: '#0078d4', bgcolor: onedriveTab === 'upload' ? '#0078d4' : 'transparent', color: '#fff', '&:hover': { bgcolor: onedriveTab === 'upload' ? '#005ca5' : 'rgba(255,255,255,0.05)' } }}
                >
                  Upload Local Video
                </Button>
              </div>
              
              {onedriveTab === 'browse' ? (
                <LinkedAccountImport
                  singleProvider="onedrive"
                  onSelectVideo={(video) => {
                    setSelectedSource('uploadLink')
                    setSourceInputValue(video.sourceUrl)
                    setSourceError('')
                    if (video.title) {
                      setFormValues(prev => ({
                        ...prev,
                        title: video.title,
                      }))
                    }
                  }}
                  onError={(msg) => {
                    setSourceError(msg)
                  }}
                />
              ) : (
                <>
                  {onedriveConnected ? (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)', marginBottom: '16px' }}>
                      {!isOneDriveUploading ? (
                        <div>
                          <p style={{ fontSize: '0.9rem', marginBottom: '12px', opacity: 0.8 }}>
                            Drag &amp; drop a video file or click below to select a video to upload directly to your connected OneDrive.
                          </p>
                          
                          <input
                            type="file"
                            accept="video/*"
                            id="onedrive-file-input"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null
                              setOnedriveLocalFile(file)
                              setSourceError('')
                            }}
                          />
                          
                          {onedriveLocalFile ? (
                            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                                🎥 {onedriveLocalFile.name} ({formatBytes(onedriveLocalFile.size)})
                              </span>
                              <Button 
                                onClick={() => setOnedriveLocalFile(null)} 
                                sx={{ minWidth: 0, color: '#ff5252', textTransform: 'none', fontSize: '0.8rem' }}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outlined"
                              onClick={() => document.getElementById('onedrive-file-input')?.click()}
                              sx={{ textTransform: 'none', borderColor: '#0078d4', color: '#fafafa', '&:hover': { borderColor: '#005ca5' } }}
                            >
                              Select Video File
                            </Button>
                          )}

                          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <Button
                              variant="text"
                              onClick={() => {
                                disconnectAccount('onedrive')
                                setOnedriveConnected(false)
                                setOnedriveLocalFile(null)
                              }}
                              sx={{ textTransform: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', '&:hover': { color: '#ff5252' } }}
                            >
                              Disconnect / Change OneDrive Account
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                          <p style={{ fontSize: '0.9rem', marginBottom: '12px' }}>
                            Uploading video to OneDrive... Please do not close this window.
                          </p>
                          <LinearProgress variant="determinate" value={onedriveProgress} style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#0078d4' }} />
                          <span style={{ display: 'block', marginTop: '8px', fontSize: '0.8rem', opacity: 0.7 }}>
                            {onedriveProgress}% completed
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', marginBottom: '16px', textAlign: 'left' }}>
                      <p style={{ fontSize: '0.9rem', marginBottom: '16px', opacity: 0.9 }}>
                        Connect your OneDrive account to upload local video files directly from your computer.
                      </p>

                      {/* Advanced Connection Settings */}
                      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '6px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                          <span className="material-icons" style={{ fontSize: '1rem', color: '#0078d4' }}>settings</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>OneDrive OAuth Configuration</span>
                        </div>

                        {/* Account Type Selection */}
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>Account Type</label>
                          <select
                            value={onedriveAccountType}
                            onChange={(e) => {
                              const type = e.target.value
                              setOnedriveAccountType(type)
                              if (type === 'personal') {
                                setOnedriveCustomTenantId('common')
                              } else {
                                setOnedriveCustomTenantId('9e7c38c3-66a5-4f8d-bdca-a8d195af3fff')
                              }
                            }}
                            className="input"
                            style={{
                              width: '100%',
                              background: 'rgba(0,0,0,0.4)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              borderRadius: '4px',
                              color: '#fff',
                              padding: '6px 10px',
                              fontSize: '0.8rem'
                            }}
                          >
                            <option value="personal">Personal / Consumer Account (Free OneDrive - Recommended)</option>
                            <option value="work">Work, School or Enterprise (Needs SPO License)</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>Client ID</label>
                            <input
                              type="text"
                              value={onedriveCustomClientId}
                              onChange={(e) => setOnedriveCustomClientId(e.target.value)}
                              placeholder="Azure App Client ID"
                              className="input"
                              style={{
                                width: '100%',
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '4px',
                                color: '#fff',
                                padding: '6px 10px',
                                fontSize: '0.8rem'
                              }}
                            />
                          </div>
                          <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>Tenant ID</label>
                            <input
                              type="text"
                              value={onedriveCustomTenantId}
                              onChange={(e) => setOnedriveCustomTenantId(e.target.value)}
                              placeholder="e.g. common, consumers, or Tenant UUID"
                              className="input"
                              style={{
                                width: '100%',
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '4px',
                                color: '#fff',
                                padding: '6px 10px',
                                fontSize: '0.8rem'
                              }}
                            />
                          </div>
                        </div>

                        {onedriveAccountType === 'personal' && (
                          <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(0, 120, 212, 0.1)', borderLeft: '3px solid #0078d4', borderRadius: '4px' }}>
                            <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.95, lineHeight: 1.4 }}>
                              💡 <strong>Personal Accounts Tip:</strong> Personal Microsoft accounts (like outlook.com) come with a free OneDrive. Ensure your Azure App Registration has <strong>"Supported account types"</strong> set to <em>"Accounts in any organizational directory and personal Microsoft accounts"</em> in the Azure portal.
                            </p>
                          </div>
                        )}
                        {onedriveAccountType === 'work' && (
                          <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(239, 83, 80, 0.1)', borderLeft: '3px solid #ef5350', borderRadius: '4px' }}>
                            <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.95, lineHeight: 1.4 }}>
                              ⚠️ <strong>License Required:</strong> Your Azure Active Directory / Entra tenant <em>must</em> have an active Office 365 or SharePoint Online (SPO) subscription. Without this, Microsoft APIs will block video storage and uploads.
                            </p>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px', justifyContent: 'center' }}>
                        <Button
                          variant="contained"
                          onClick={async () => {
                            setSourceError('')
                            try {
                              await connectOneDriveWithImplicitToken(onedriveCustomClientId, onedriveCustomTenantId)
                              setOnedriveConnected(true)
                            } catch (err) {
                              setSourceError(err.message || 'Failed to connect OneDrive.')
                            }
                          }}
                          sx={{ textTransform: 'none', background: '#0078d4', color: '#fff', '&:hover': { background: '#005ca5' } }}
                        >
                          Connect OneDrive Account
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setShowOneDriveManualInput(prev => !prev)
                            setSourceError('')
                          }}
                          sx={{ textTransform: 'none', color: '#fff', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: '#fff', background: 'rgba(255,255,255,0.1)' } }}
                        >
                          {showOneDriveManualInput ? 'Hide Token Entry' : 'Use Access Token / CLI Token'}
                        </Button>
                      </div>

                      {showOneDriveManualInput && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '8px', textAlign: 'left' }}>
                            Enter a Microsoft Graph <strong>Access Token</strong> to bypass login popups:
                          </p>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <input
                              type="password"
                              placeholder="Paste OneDrive Personal Access Token..."
                              value={onedriveManualTokenState}
                              onChange={(e) => setOnedriveManualTokenState(e.target.value)}
                              className="input"
                              style={{
                                flex: 1,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '4px',
                                color: '#fff',
                                padding: '6px 12px',
                                fontSize: '0.85rem'
                              }}
                            />
                            <Button
                              variant="contained"
                              onClick={async () => {
                                if (!onedriveManualTokenState.trim()) {
                                  setSourceError('Please enter a valid token.')
                                  return
                                }
                                try {
                                  const accounts = getConnectedAccounts()
                                  const newAccount = {
                                    provider: 'onedrive',
                                    connected: true,
                                    user: {
                                      uuid: `onedrive-user-manual-${Date.now()}`,
                                      first_name: 'OneDrive',
                                      last_name: 'User (Manual)',
                                      email: `onedrive.${Date.now()}@manual.local`,
                                      registration_type: 'onedrive',
                                      active: 1,
                                      onedrive_access_token: onedriveManualTokenState.trim(),
                                      access_token: onedriveManualTokenState.trim(),
                                    }
                                  }
                                  const filtered = accounts.filter(a => a.provider !== 'onedrive')
                                  filtered.push(newAccount)
                                  saveConnectedAccounts(filtered)
                                  setOnedriveConnected(true)
                                  setOnedriveManualTokenState('')
                                  setShowOneDriveManualInput(false)
                                } catch (err) {
                                  setSourceError('Failed to save manual token: ' + err.message)
                                }
                              }}
                              sx={{ textTransform: 'none', background: '#2e7d32', color: '#fff', '&:hover': { background: '#1b5e20' } }}
                            >
                              Connect Token
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {!isOneDriveUploading && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '8px' }}>
                    — OR —
                  </p>
                  <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '8px' }}>
                    Paste a direct shared link from OneDrive:
                  </p>
                  <div className="upload-link-wrap" style={{ margin: '0 auto', maxWidth: '480px' }}>
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
                      disabled={Boolean(onedriveLocalFile)}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
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
          )}
          {sourceError ? <p className="upload-desc" style={{ top: 'auto', marginTop: 8, color: '#ffdddd' }}>{sourceError}</p> : null}
        </div>

        {selectedSource === LINKED_ACCOUNT_SOURCE.id && (
          <div className="upload-linked-accounts-panel">
            <LinkedAccountImport
              onSelectVideo={(video) => {
                setSelectedSource(SOURCE_OPTIONS.find((s) => s.id === 'uploadLink')?.id || 'uploadLink')
                setSourceInputValue(video.sourceUrl)
                setSourceError('')
                if (video.title && formValues.title === '') {
                  // Title will be set in step 2
                }
              }}
              onError={(msg) => {
                setSourceError(msg)
              }}
            />
          </div>
        )}
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
                variant="filled"
                sx={step2FieldSx}
                slotProps={{
                  helperText: helperTextNoShadowProps,
                  input: { disableUnderline: true },
                  htmlInput: { className: 'input', 'aria-label': 'Video title' }
                }}
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
                variant="filled"
                sx={step2FieldSx}
                slotProps={{
                  helperText: helperTextNoShadowProps,
                  input: { disableUnderline: true },
                  htmlInput: { className: 'input', 'aria-label': 'Video privacy' }
                }}
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
                variant="filled"
                sx={step2FieldSx}
                slotProps={{
                  helperText: helperTextNoShadowProps,
                  input: { disableUnderline: true },
                  htmlInput: { className: 'input', 'aria-label': 'Discussion link' }
                }}
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
              variant="filled"
              sx={step2DescriptionFieldSx}
              slotProps={{
                helperText: helperTextNoShadowProps,
                input: { disableUnderline: true },
                htmlInput: { className: 'input', 'aria-label': 'Video description' }
              }}
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
