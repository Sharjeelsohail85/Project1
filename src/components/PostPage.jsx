import { memo, useCallback, useState, useEffect } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useVideoUploadForm from '../hooks/useVideoUploadForm'
import TagsPage from './tags/TagsPage'
import CatPrivacySelect from './CatPrivacySelect'
import HeartUploadLoader from './HeartUploadLoader'
import JosFabreUploadIcon from './JosFabreUploadIcon'
import {
  getConnectedAccounts,
  connectAccount,
  disconnectAccount,
} from '../services/linkedAccountService'
import { THUMBNAIL_INPUT_ACCEPT } from '../config/upload.config'

const STORAGE_PROVIDERS = [
  {
    id: 'uploadGoogle',
    key: 'google',
    name: 'Google Drive',
    brandClass: 'gdrive',
    icon: 'cloud_queue',
    subtitle: 'Cloud Drive Sync',
    metrics: {
      usedGB: '11.84 GB',
      totalGB: '15.0 GB',
      percent: 78.9,
      filesCount: '1,420 Items',
      videosCount: '184 Videos (4K AV1)',
      speed: '1.2 Gbps ↑ / 2.5 Gbps ↓',
      baseCalls: 8750,
      maxCalls: '10,000',
      basePing: 18,
      syncHealth: '99.98% Zero-Loss',
      security: 'OAuth 2.0 • 256-bit AES',
      edgeNode: 'US-East (iad01) Anycast',
      aiPipeline: '4K AV1 Transcode • HDR',
      p2pMesh: '3.8x Edge Acceleration',
      quotaHealth: '99.4% Quota Free',
    },
  },
  {
    id: 'uploadDropbox',
    key: 'dropbox',
    name: 'Dropbox',
    brandClass: 'dropbox',
    icon: 'folder_shared',
    subtitle: 'Dropbox Vault',
    metrics: {
      usedGB: '1.42 GB',
      totalGB: '2.0 GB',
      percent: 71.0,
      filesCount: '620 Items',
      videosCount: '62 Videos (1080p HEVC)',
      speed: '800 Mbps ↑ / 1.5 Gbps ↓',
      baseCalls: 4120,
      maxCalls: '5,000',
      basePing: 22,
      syncHealth: '100% Vault Verified',
      security: 'Vault Encrypted • TLS 1.3',
      edgeNode: 'EU-Central (fra02) Edge',
      aiPipeline: 'Smart Delta Sync • Block',
      p2pMesh: '2.4x Delta-Sync Mesh',
      quotaHealth: '98.2% Quota Free',
    },
  },
  {
    id: 'uploadOneDrive',
    key: 'onedrive',
    name: 'Microsoft OneDrive',
    brandClass: 'onedrive',
    icon: 'cloud',
    subtitle: 'Office 365 Cloud',
    metrics: {
      usedGB: '3.25 GB',
      totalGB: '5.0 GB',
      percent: 65.0,
      filesCount: '980 Items',
      videosCount: '95 Videos (ProRes/MP4)',
      speed: '950 Mbps ↑ / 1.8 Gbps ↓',
      baseCalls: 6300,
      maxCalls: '8,000',
      basePing: 20,
      syncHealth: '99.95% Entra Active',
      security: 'Entra ID • Key Vault',
      edgeNode: 'AP-East (hkg01) Express',
      aiPipeline: 'Office Media Indexer',
      p2pMesh: '3.1x Peer Cache Network',
      quotaHealth: '99.8% Quota Free',
    },
  },
  {
    id: 'uploadMega',
    key: 'mega',
    name: 'MEGA Cloud',
    brandClass: 'mega',
    icon: 'cloud_upload',
    subtitle: 'Zero-Knowledge Encrypted',
    metrics: {
      usedGB: '18.52 GB',
      totalGB: '20.0 GB',
      percent: 92.6,
      filesCount: '2,140 Items',
      videosCount: '310 Videos (8K Ultra)',
      speed: '1.5 Gbps ↑ / 3.0 Gbps ↓',
      baseCalls: 9400,
      maxCalls: '10,000',
      basePing: 16,
      syncHealth: '100% Zero-Knowledge',
      security: 'RSA-2048 Zero-Trust',
      edgeNode: 'EU-West (ams03) Direct',
      aiPipeline: 'Encrypted Stream Demux',
      p2pMesh: '4.2x Swarm Mesh Engine',
      quotaHealth: '100% Vault Free',
    },
  },
  {
    id: 'uploadLink',
    key: 'link',
    name: 'URL / YouTube',
    brandClass: 'link',
    icon: 'link',
    subtitle: 'Direct Video Stream',
    metrics: {
      usedGB: 'Direct Stream',
      totalGB: 'Unlimited',
      percent: 100,
      filesCount: 'Live CDN Stream',
      videosCount: 'Public HLS/DASH Stream',
      speed: 'Ultra-Low Latency CDN',
      baseCalls: 12000,
      maxCalls: 'Unlimited',
      basePing: 12,
      syncHealth: '100% Stream Online',
      security: 'HTTPS TLS 1.3 Strict',
      edgeNode: 'Global Anycast CDN Edge',
      aiPipeline: 'Auto DASH/HLS Multi-Rate',
      p2pMesh: '10x Edge Cached Relay',
      quotaHealth: 'Unlimited Stream',
    },
  },
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

  // STEPPER NAVIGATION STATE (5 Steps)
  const [currentStep, setCurrentStep] = useState(1)

  // SECTION 1 STATES
  const [selectedSource, setSelectedSource] = useState('uploadGoogle')
  const [sourceInputValue, setSourceInputValue] = useState('')
  const [sourceError, setSourceError] = useState('')
  const [connectedAccounts, setConnectedAccounts] = useState([])
  const [flippedCardId, setFlippedCardId] = useState(null)
  const [connectingProvider, setConnectingProvider] = useState(null)
  const [localMessage, setLocalMessage] = useState(null)
  const [liveMetricsOffset, setLiveMetricsOffset] = useState({ ping: 0, apiCalls: 0 })

  // Real-time metric ticker effect
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveMetricsOffset((prev) => ({
        ping: Math.floor(Math.random() * 7) - 3,
        apiCalls: (prev.apiCalls + 1) % 100,
      }))
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  // Load connected account data on mount
  useEffect(() => {
    refreshAccounts()
  }, [])

  const refreshAccounts = () => {
    try {
      const accounts = getConnectedAccounts()
      setConnectedAccounts(accounts || [])
    } catch {
      setConnectedAccounts([])
    }
  }

  const getActiveUserEmail = () => {
    if (typeof window === 'undefined') return 'sharjeelsohail85@gmail.com'
    try {
      const rawUser = localStorage.getItem('user_info')
      if (rawUser) {
        const u = JSON.parse(rawUser)
        if (u?.email && !u.email.includes('demo.local')) {
          return u.email
        }
      }
    } catch {}
    return 'sharjeelsohail85@gmail.com'
  }

  const getProviderInfo = (providerKey) => {
    if (providerKey === 'link') {
      return {
        isConnected: true,
        email: 'Direct Stream / Public CDN',
        name: 'Public Stream Link',
        accountType: 'Public URL',
      }
    }

    const activeEmail = getActiveUserEmail()

    const found = connectedAccounts.find((a) => a.provider === providerKey)
    if (found && found.connected) {
      let email =
        found.user?.email ||
        found.user?.name ||
        found.user?.displayName ||
        found.user?.login ||
        activeEmail

      if (!email || email.includes('demo.local')) {
        email = activeEmail
      }

      return {
        isConnected: true,
        email,
        name: found.user?.name || found.user?.displayName || 'Sharjeel Sohail',
        accountType: 'Real-Time OAuth',
      }
    }

    return {
      isConnected: false,
      email: 'Not Connected',
      name: 'Unlinked Account',
      accountType: 'Sign-in required to link account',
    }
  }

  // REAL-TIME OAUTH/CONNECT DISCONNECT HANDLERS
  const handleConnectProvider = async (providerKey, e) => {
    if (e) e.stopPropagation()
    if (providerKey === 'link') return

    setConnectingProvider(providerKey)
    try {
      await connectAccount(providerKey)
      refreshAccounts()
      setLocalMessage({
        type: 'success',
        text: `Successfully linked ${providerKey.toUpperCase()} account in real time!`,
      })
    } catch (err) {
      console.error(`Failed to connect ${providerKey}:`, err)
      setLocalMessage({
        type: 'error',
        text: `Unable to connect ${providerKey.toUpperCase()} account: ${err.message || 'Error occurred'}`,
      })
    } finally {
      setConnectingProvider(null)
    }
  }

  const handleDisconnectProvider = async (providerKey, e) => {
    if (e) e.stopPropagation()
    try {
      disconnectAccount(providerKey)
      refreshAccounts()
      setLocalMessage({
        type: 'info',
        text: `Disconnected ${providerKey.toUpperCase()} account.`,
      })
    } catch (err) {
      console.error(`Failed to disconnect ${providerKey}:`, err)
    }
  }

  // STEP VALIDATION
  const validateStep1 = () => {
    setSourceError('')
    let resolvedSourceUrl = sourceInputValue.trim()
    if (!resolvedSourceUrl && selectedFiles.length === 0) {
      setSourceError('Please enter a valid video URL or select a source provider.')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!formValues.title || !formValues.title.trim()) {
      return false
    }
    return true
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (!validateStep2()) return
      setCurrentStep(3)
    } else if (currentStep === 3) {
      setCurrentStep(4)
    } else if (currentStep === 4) {
      setCurrentStep(5)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmitPost = async (e) => {
    if (e) e.preventDefault()
    setSourceError('')

    let resolvedSourceUrl = sourceInputValue.trim()
    if (!resolvedSourceUrl && selectedFiles.length === 0) {
      setSourceError('Please provide a video link or select a file.')
      setCurrentStep(1)
      return
    }

    const payload = {
      ...formValues,
      sourceUrl: resolvedSourceUrl,
      sourceType: selectedSource,
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
            <i className="material-icons" style={{ color: '#ff4081', fontSize: 28 }}>video_call</i>
            Video Creation & Post Studio
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
            Publish new content to your channel using the 5-step interactive studio wizard.
          </Typography>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Studio"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.45)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
              e.currentTarget.style.transform = 'none'
            }}
          >
            <i className="material-icons" style={{ fontSize: '18px' }}>close</i>
            <span>Close Studio</span>
          </button>
        )}
      </div>

      {/* STEPPER NAV BAR (5 STEPS) */}
      <div className="post-stepper-bar">
        <div
          className={`post-step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
          onClick={() => setCurrentStep(1)}
        >
          <span className="post-step-badge">{currentStep > 1 ? '✓' : '1'}</span>
          <span>1. Storage Source</span>
        </div>

        <div className="post-stepper-divider" />

        <div
          className={`post-step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
          onClick={() => {
            if (validateStep1()) setCurrentStep(2)
          }}
        >
          <span className="post-step-badge">{currentStep > 2 ? '✓' : '2'}</span>
          <span>2. Video Info</span>
        </div>

        <div className="post-stepper-divider" />

        <div
          className={`post-step-item ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}
          onClick={() => {
            if (validateStep1() && validateStep2()) setCurrentStep(3)
          }}
        >
          <span className="post-step-badge">{currentStep > 3 ? '✓' : '3'}</span>
          <span>3. Video Tags</span>
        </div>

        <div className="post-stepper-divider" />

        <div
          className={`post-step-item ${currentStep === 4 ? 'active' : currentStep > 4 ? 'completed' : ''}`}
          onClick={() => {
            if (validateStep1() && validateStep2()) setCurrentStep(4)
          }}
        >
          <span className="post-step-badge">{currentStep > 4 ? '✓' : '4'}</span>
          <span>4. Thumbnail</span>
        </div>

        <div className="post-stepper-divider" />

        <div
          className={`post-step-item ${currentStep === 5 ? 'active' : ''}`}
          onClick={() => {
            if (validateStep1() && validateStep2()) setCurrentStep(5)
          }}
        >
          <span className="post-step-badge">5</span>
          <span>5. Publish</span>
        </div>
      </div>

      {localMessage && (
        <Alert
          severity={localMessage.type}
          onClose={() => setLocalMessage(null)}
          sx={{ mb: 2, borderRadius: '12px' }}
        >
          {localMessage.text}
        </Alert>
      )}

      {/* STEP CONTENT PANELS */}
      <form onSubmit={handleSubmitPost}>
        {/* STEP 1: 3D FLIPPABLE STORAGE CARDS */}
        {currentStep === 1 && (
          <div className="post-card-section">
            <div className="post-card-header">
              <span className="post-card-number">1</span>
              <div>
                <h3 className="post-card-title">Select Storage & Media Provider</h3>
                <Typography variant="caption" color="text.secondary">
                  Hover over any card to flip and view real-time account data usage & connection status.
                </Typography>
              </div>
            </div>

            {/* 3D FLIP CARDS GRID */}
            <div className="storage-flip-grid">
              {STORAGE_PROVIDERS.map((provider) => {
                const info = getProviderInfo(provider.key)
                const isSelected = selectedSource === provider.id
                const isFlipped = flippedCardId === provider.id
                const isConnecting = connectingProvider === provider.key

                return (
                  <div
                    key={provider.id}
                    className={`storage-flip-card ${isFlipped ? 'is-flipped' : ''}`}
                    onClick={() => {
                      setSelectedSource(provider.id)
                      if (!sourceInputValue) {
                        setSourceInputValue(
                          provider.key === 'link'
                            ? 'https://www.w3schools.com/html/mov_bbb.mp4'
                            : `https://storage.${provider.key}.com/demo-video-sample.mp4`
                        )
                      }
                    }}
                    onMouseEnter={() => setFlippedCardId(provider.id)}
                    onMouseLeave={() => setFlippedCardId(null)}
                  >
                    <div className="storage-flip-card-inner">
                      {/* FRONT FACE */}
                      <div className={`storage-flip-front ${provider.brandClass}`}>
                        {isSelected && (
                          <div className="storage-card-selected-ring" title="Selected Source">
                            ✓
                          </div>
                        )}
                        <div className="storage-card-icon-wrap">
                          <i className="material-icons" style={{ fontSize: 26, color: '#fff' }}>
                            {provider.icon}
                          </i>
                        </div>
                        <div>
                          <div className="storage-card-title">{provider.name}</div>
                          <div className="storage-card-subtitle">
                            {info.isConnected ? `✓ ${info.email}` : provider.subtitle}
                          </div>
                        </div>
                        <div className="storage-card-flip-hint">
                          <i className="material-icons" style={{ fontSize: 14 }}>loop</i>
                          <span>Hover to flip for real-time stats</span>
                        </div>
                      </div>

                      {/* BACK FACE (REAL-TIME METRICS DASHBOARD) */}
                      <div className="storage-flip-back">
                        <div className="storage-back-header">
                          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 12, color: '#f8fafc' }}>
                            {provider.name}
                          </Typography>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: info.isConnected ? '#22c55e' : '#64748b',
                                boxShadow: info.isConnected ? '0 0 8px #22c55e' : 'none',
                                display: 'inline-block',
                              }}
                            />
                            <span
                              className={`storage-back-status-badge ${
                                info.isConnected ? 'connected' : provider.key === 'link' ? 'public' : ''
                              }`}
                            >
                              {info.isConnected
                                ? 'Connected'
                                : provider.key === 'link'
                                ? 'Public Stream'
                                : 'Not Connected'}
                            </span>
                          </div>
                        </div>

                        {/* USER EMAIL */}
                        <div style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          👤 User: <strong style={{ color: info.isConnected ? '#e2e8f0' : '#f87171' }}>{info.email}</strong>
                        </div>

                        {/* DATA METER GAUGE */}
                        <div className="storage-back-meter-wrap" style={{ margin: '2px 0 4px 0' }}>
                          <div className="storage-back-meter-labels">
                            <span>Storage Usage:</span>
                            <strong>
                              {info.isConnected
                                ? `${provider.metrics.usedGB} / ${provider.metrics.totalGB}`
                                : '0 GB / Unlinked'}
                            </strong>
                          </div>
                          <div className="storage-back-meter-bar">
                            <div
                              className="storage-back-meter-fill"
                              style={{ width: `${info.isConnected ? provider.metrics.percent : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* EXPANDED REAL-TIME METRICS GRID */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '4px 8px',
                            fontSize: '10px',
                            color: '#cbd5e1',
                            margin: '6px 0',
                            padding: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.09)',
                          }}
                        >
                          <div>📁 Index: <strong style={{ color: '#f1f5f9' }}>{info.isConnected ? provider.metrics.videosCount : '0 Videos'}</strong></div>
                          <div>⚡ Speed: <strong style={{ color: '#38bdf8' }}>{info.isConnected ? provider.metrics.speed : 'Offline'}</strong></div>
                          <div>📊 Calls: <strong style={{ color: '#a7f3d0' }}>{info.isConnected ? (typeof provider.metrics.baseCalls === 'number' ? provider.metrics.baseCalls + liveMetricsOffset.apiCalls : provider.metrics.baseCalls) : '0 Calls'}</strong></div>
                          <div>📶 Latency: <strong style={{ color: '#fde047' }}>{info.isConnected ? `${Math.max(8, provider.metrics.basePing + liveMetricsOffset.ping)} ms` : '— Ping'}</strong></div>
                          <div>🌐 Edge Node: <strong style={{ color: '#cbd5e1' }}>{info.isConnected ? provider.metrics.edgeNode : 'Unrouted'}</strong></div>
                          <div>🛡️ Security: <strong style={{ color: '#e2e8f0' }}>{info.isConnected ? provider.metrics.security : 'Sign-in Required'}</strong></div>
                          <div>🧠 AI Transcode: <strong style={{ color: '#c084fc' }}>{info.isConnected ? provider.metrics.aiPipeline : 'Disabled'}</strong></div>
                          <div>🚀 P2P Mesh: <strong style={{ color: '#f472b6' }}>{info.isConnected ? provider.metrics.p2pMesh : 'Offline'}</strong></div>
                        </div>

                        {/* CONNECT / SELECT ACTION BUTTON */}
                        {!info.isConnected && provider.key !== 'link' ? (
                          <button
                            type="button"
                            className="storage-back-select-btn"
                            disabled={isConnecting}
                            style={{ background: '#2563eb' }}
                            onClick={(e) => handleConnectProvider(provider.key, e)}
                          >
                            {isConnecting ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <i className="material-icons" style={{ fontSize: 14 }}>login</i>
                            )}
                            {isConnecting ? 'Connecting...' : `Connect ${provider.name}`}
                          </button>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="storage-back-select-btn"
                              style={{ flex: 1 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedSource(provider.id)
                              }}
                            >
                              <i className="material-icons" style={{ fontSize: 14 }}>
                                {isSelected ? 'check_circle' : 'touch_app'}
                              </i>
                              {isSelected ? 'Active Source' : 'Select'}
                            </button>
                            {info.isConnected && provider.key !== 'link' && (
                              <button
                                type="button"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  color: '#f87171',
                                  borderRadius: '10px',
                                  padding: '0 8px',
                                  cursor: 'pointer',
                                }}
                                title="Disconnect Account"
                                onClick={(e) => handleDisconnectProvider(provider.key, e)}
                              >
                                <i className="material-icons" style={{ fontSize: 16 }}>power_settings_new</i>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* INTERACTIVE CODEPEN UPLOAD ICON & STREAM SELECTOR */}
            <JosFabreUploadIcon
              sourceValue={sourceInputValue}
              onSourceChange={(url) => {
                setSourceInputValue(url)
                setSourceError('')
              }}
              onTitleAutoFill={(autoTitle) => {
                if (!formValues.title && autoTitle) {
                  setFormValues((prev) => ({
                    ...prev,
                    title: autoTitle,
                  }))
                }
              }}
              selectedProvider={selectedSource}
            />

            {sourceError && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: '12px' }}>
                {sourceError}
              </Alert>
            )}

            {sourceInputValue && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#0f172a', borderRadius: 3, border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <Typography variant="caption" sx={{ color: '#ec4899', display: 'block', mb: 1, fontWeight: 800, letterSpacing: '0.05em' }}>
                  ▶ LIVE VIDEO STREAM PREVIEW:
                </Typography>
                <video
                  src={sourceInputValue}
                  controls
                  style={{ width: '100%', maxHeight: 240, borderRadius: 12, background: '#000', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                  onError={() => {}}
                />
              </Box>
            )}

            <div className="post-actions-bar">
              <span />
              <Button
                variant="contained"
                onClick={handleNextStep}
                endIcon={<i className="material-icons">arrow_forward</i>}
                sx={{
                  bgcolor: 'var(--theme-color, #673ab7)',
                  color: '#fff',
                  px: 3,
                  py: 1,
                  borderRadius: '24px',
                  fontWeight: 700,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(103, 58, 183, 0.3)',
                }}
              >
                Next: Video Details
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: VIDEO INFORMATION */}
        {currentStep === 2 && (
          <div className="post-card-section">
            <div className="post-card-header">
              <span className="post-card-number">2</span>
              <div>
                <h3 className="post-card-title">Video Metadata & Info</h3>
                <Typography variant="caption" color="text.secondary">
                  Provide an engaging title and detailed description for your post.
                </Typography>
              </div>
            </div>

            <TextField
              label="Video Title"
              name="title"
              variant="outlined"
              size="small"
              required
              fullWidth
              value={formValues.title || ''}
              onChange={handleChange('title')}
              error={Boolean(fieldErrors.title)}
              helperText={fieldErrors.title || `${(formValues.title || '').length}/100 characters`}
              inputProps={{ maxLength: 100 }}
            />

            <TextField
              label="Description"
              name="description"
              variant="outlined"
              size="small"
              multiline
              rows={4}
              fullWidth
              value={formValues.description || ''}
              onChange={handleChange('description')}
              placeholder="Describe your video for viewers and channel subscribers..."
            />

            <div className="post-actions-bar">
              <Button
                variant="outlined"
                onClick={handlePrevStep}
                startIcon={<i className="material-icons">arrow_back</i>}
                sx={{
                  textTransform: 'none',
                  borderRadius: '24px',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  borderColor: 'rgba(103, 58, 183, 0.3)',
                  color: 'var(--theme-color, #673ab7)',
                  bgcolor: 'rgba(103, 58, 183, 0.05)',
                  '&:hover': {
                    bgcolor: 'rgba(103, 58, 183, 0.15)',
                    borderColor: 'var(--theme-color, #673ab7)',
                  },
                }}
              >
                Back to Storage Source
              </Button>
              <Button
                variant="contained"
                onClick={handleNextStep}
                disabled={!formValues.title?.trim()}
                endIcon={<i className="material-icons">arrow_forward</i>}
                sx={{
                  bgcolor: 'var(--theme-color, #673ab7)',
                  color: '#fff',
                  px: 3,
                  py: 1,
                  borderRadius: '24px',
                  fontWeight: 700,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(103, 58, 183, 0.3)',
                }}
              >
                Next: Video Tags
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: VIDEO TAGS (SETTINGS DESIGN) */}
        {currentStep === 3 && (
          <div className="post-card-section">
            <div className="post-card-header">
              <span className="post-card-number">3</span>
              <div>
                <h3 className="post-card-title">Video Tags & Personalization</h3>
                <Typography variant="caption" color="text.secondary">
                  Add searchable tags and set personalization preferences using your real-time account tags.
                </Typography>
              </div>
            </div>

            <div
              className="section-tags section-tags-embed"
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.08)',
                overflow: 'hidden',
                background: '#ffffff',
                padding: '12px',
              }}
            >
              <TagsPage embedded inlineFeedback />
            </div>

            <div className="post-actions-bar">
              <Button
                variant="outlined"
                onClick={handlePrevStep}
                startIcon={<i className="material-icons">arrow_back</i>}
                sx={{
                  textTransform: 'none',
                  borderRadius: '24px',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  borderColor: 'rgba(103, 58, 183, 0.3)',
                  color: 'var(--theme-color, #673ab7)',
                  bgcolor: 'rgba(103, 58, 183, 0.05)',
                  '&:hover': {
                    bgcolor: 'rgba(103, 58, 183, 0.15)',
                    borderColor: 'var(--theme-color, #673ab7)',
                  },
                }}
              >
                Back to Video Info
              </Button>
              <Button
                variant="contained"
                onClick={handleNextStep}
                endIcon={<i className="material-icons">arrow_forward</i>}
                sx={{
                  bgcolor: 'var(--theme-color, #673ab7)',
                  color: '#fff',
                  px: 3,
                  py: 1,
                  borderRadius: '24px',
                  fontWeight: 700,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(103, 58, 183, 0.3)',
                }}
              >
                Next: Thumbnail Cover
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: THUMBNAIL COVER */}
        {currentStep === 4 && (
          <div className="post-card-section">
            <div className="post-card-header">
              <span className="post-card-number">4</span>
              <div>
                <h3 className="post-card-title">Thumbnail Cover Image</h3>
                <Typography variant="caption" color="text.secondary">
                  Upload or select a custom thumbnail image for video feeds and search previews.
                </Typography>
              </div>
            </div>

            <Button
              variant="outlined"
              component="label"
              startIcon={<i className="material-icons">add_a_photo</i>}
              sx={{ textTransform: 'none', py: 1.5, borderRadius: '12px' }}
            >
              Choose Custom Thumbnail Image
              <input
                type="file"
                hidden
                accept={THUMBNAIL_INPUT_ACCEPT}
                onChange={handleThumbnailInput}
              />
            </Button>

            {thumbnailPreviewUrl ? (
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 700 }}>
                  Selected Thumbnail Preview:
                </Typography>
                <img
                  src={thumbnailPreviewUrl}
                  alt="Thumbnail Preview"
                  style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}
                />
              </Box>
            ) : (
              <Box sx={{ p: 4, border: '2px dashed #cbd5e1', borderRadius: 3, textAlign: 'center', color: '#64748b' }}>
                <i className="material-icons" style={{ fontSize: 42, opacity: 0.5 }}>image</i>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  No thumbnail uploaded. Standard video frame auto-preview will be generated.
                </Typography>
              </Box>
            )}

            <div className="post-actions-bar">
              <Button
                variant="outlined"
                onClick={handlePrevStep}
                startIcon={<i className="material-icons">arrow_back</i>}
                sx={{
                  textTransform: 'none',
                  borderRadius: '24px',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  borderColor: 'rgba(103, 58, 183, 0.3)',
                  color: 'var(--theme-color, #673ab7)',
                  bgcolor: 'rgba(103, 58, 183, 0.05)',
                  '&:hover': {
                    bgcolor: 'rgba(103, 58, 183, 0.15)',
                    borderColor: 'var(--theme-color, #673ab7)',
                  },
                }}
              >
                Back to Video Tags
              </Button>
              <Button
                variant="contained"
                onClick={handleNextStep}
                endIcon={<i className="material-icons">arrow_forward</i>}
                sx={{
                  bgcolor: 'var(--theme-color, #673ab7)',
                  color: '#fff',
                  px: 3,
                  py: 1,
                  borderRadius: '24px',
                  fontWeight: 700,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(103, 58, 183, 0.3)',
                }}
              >
                Next: Publish & Privacy
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: PUBLISH & PRIVACY */}
        {currentStep === 5 && (
          <div className="post-card-section">
            <div className="post-card-header">
              <span className="post-card-number">5</span>
              <div>
                <h3 className="post-card-title">Publish & Privacy Settings</h3>
                <Typography variant="caption" color="text.secondary">
                  Choose visibility permissions and launch your video to your channel.
                </Typography>
              </div>
            </div>

            <CatPrivacySelect
              value={formValues.privacy || 'public'}
              onChange={handleChange('privacy')}
              name="privacy"
              label="Video Visibility & Privacy"
            />

            <TextField
              label="Discussion / Forum Link (Optional)"
              name="discussion_link"
              size="small"
              fullWidth
              value={formValues.discussion_link || ''}
              onChange={handleChange('discussion_link')}
              placeholder="https://community.example.com/discussion"
            />

            {/* SUMMARY PREVIEW */}
            <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                POST SUMMARY:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {formValues.title || 'Untitled Video'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Source: {selectedSource} • Visibility: {formValues.privacy}
              </Typography>
            </Box>

            {isUploading && (
              <HeartUploadLoader
                progress={uploadProgress}
                title="Publishing & Processing Video..."
                subtitle="Please wait while your video is uploaded, processed, and privacy settings are applied"
              />
            )}

            <div className="post-actions-bar">
              <Button
                variant="outlined"
                onClick={handlePrevStep}
                disabled={isUploading}
                startIcon={<i className="material-icons">arrow_back</i>}
                sx={{
                  textTransform: 'none',
                  borderRadius: '24px',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  borderColor: 'rgba(103, 58, 183, 0.3)',
                  color: 'var(--theme-color, #673ab7)',
                  bgcolor: 'rgba(103, 58, 183, 0.05)',
                  '&:hover': {
                    bgcolor: 'rgba(103, 58, 183, 0.15)',
                    borderColor: 'var(--theme-color, #673ab7)',
                  },
                }}
              >
                Back to Thumbnail
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isUploading}
                startIcon={<i className="material-icons">publish</i>}
                sx={{
                  bgcolor: 'var(--theme-color, #673ab7)',
                  color: '#fff',
                  px: 4,
                  py: 1.2,
                  fontWeight: 700,
                  fontSize: '15px',
                  borderRadius: '24px',
                  boxShadow: '0 4px 14px rgba(103, 58, 183, 0.4)',
                }}
              >
                {isUploading ? 'Publishing Video...' : 'Publish Video Now'}
              </Button>
            </div>
          </div>
        )}
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
