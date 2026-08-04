import React, { useState, useRef, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

export default function JosFabreUploadIcon({
  sourceValue = '',
  onSourceChange,
  onFileSelect,
  onTitleAutoFill,
  onNextStep,
  selectedProvider = 'uploadLink',
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileDetails, setFileDetails] = useState(null)
  const [activeTab, setActiveTab] = useState('file') // 'file' or 'url'
  const [uploadState, setUploadState] = useState('idle') // 'idle', 'hover', 'selected', 'ready'
  const fileInputRef = useRef(null)

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileProcess = useCallback((file) => {
    if (!file) return
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|ogg|mov|mkv|avi|m4v)$/i)) {
      alert('Please select a valid video file (MP4, WebM, MOV, etc.)')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '')

    setFileDetails({
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || 'video/mp4',
      objectUrl,
    })
    setUploadState('ready')

    if (onSourceChange) {
      onSourceChange(objectUrl)
    }

    if (onFileSelect) {
      onFileSelect(file)
    }

    if (onTitleAutoFill) {
      onTitleAutoFill(cleanTitle)
    }
  }, [onSourceChange, onFileSelect, onTitleAutoFill])

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0])
    }
  }

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="jos-fabre-upload-container">
      <style>{`
        .jos-fabre-upload-container {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #170e2b 100%);
          border-radius: 20px;
          padding: 28px 24px;
          color: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.25);
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          margin-top: 24px;
          position: relative;
          overflow: hidden;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Mode Switcher Tabs */
        .upload-mode-switcher {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.06);
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 20px;
          width: fit-content;
        }

        .upload-mode-btn {
          padding: 8px 18px;
          border-radius: 99px;
          border: none;
          background: transparent;
          color: #94a3b8;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .upload-mode-btn.active {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(236, 72, 153, 0.35);
        }

        /* Interactive Dropzone Card */
        .upload-dropzone-box {
          border: 2px dashed ${isDragOver ? '#ec4899' : 'rgba(168, 85, 247, 0.4)'};
          background: ${isDragOver ? 'rgba(236, 72, 153, 0.08)' : 'rgba(30, 27, 75, 0.4)'};
          border-radius: 18px;
          padding: 32px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          text-align: center;
        }

        .upload-dropzone-box:hover {
          border-color: #f472b6;
          background: rgba(236, 72, 153, 0.06);
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(236, 72, 153, 0.15);
        }

        /* CodePen Animated SVG Icon Container */
        .codepen-svg-icon-wrap {
          width: 88px;
          height: 88px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .codepen-svg-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, rgba(139, 92, 246, 0.1) 70%, transparent 100%);
          filter: blur(12px);
          animation: pulseGlow 2.5s infinite alternate ease-in-out;
        }

        @keyframes pulseGlow {
          0% { transform: scale(0.85); opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 0.95; }
        }

        /* SVG Arrow Float Animation */
        .svg-arrow-anim {
          animation: floatArrow 1.8s ease-in-out infinite alternate;
          transform-origin: center;
        }

        @keyframes floatArrow {
          0% { transform: translateY(2px) scale(0.98); }
          100% { transform: translateY(-6px) scale(1.04); }
        }

        /* SVG Ring Orbit */
        .svg-ring-orbit {
          transform-origin: center;
          animation: rotateOrbit 12s linear infinite;
        }

        @keyframes rotateOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .upload-title-text {
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: #f8fafc;
          margin-bottom: 6px;
        }

        .upload-subtitle-text {
          font-size: 13px;
          color: #94a3b8;
          max-width: 380px;
          line-height: 1.4;
          margin-bottom: 14px;
        }

        .upload-btn-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
          color: #ffffff;
          padding: 8px 20px;
          border-radius: 99px;
          font-weight: 700;
          font-size: 13px;
          box-shadow: 0 4px 14px rgba(236, 72, 153, 0.4);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .upload-dropzone-box:hover .upload-btn-chip {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(236, 72, 153, 0.6);
        }

        /* URL Input Field Styling */
        .url-input-container {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .url-input-field {
          width: 100%;
          background: rgba(30, 27, 75, 0.8);
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 10px;
          padding: 12px 16px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .url-input-field:focus {
          border-color: #ec4899;
          box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.2);
        }

        /* File Selected Banner */
        .selected-file-badge {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 12px;
          padding: 12px 16px;
          margin-top: 16px;
        }
      `}</style>

      {/* Hidden HTML File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska,video/x-msvideo,.mp4,.webm,.mov,.mkv,.avi"
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ color: '#ec4899', fontSize: '20px' }}>⚡</span>
            Interactive Video Stream & File Upload
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Upload video files directly from your computer or enter a direct media streaming URL
          </Typography>
        </div>

        {/* Mode Switcher */}
        <div className="upload-mode-switcher">
          <button
            type="button"
            className={`upload-mode-btn ${activeTab === 'file' ? 'active' : ''}`}
            onClick={() => setActiveTab('file')}
          >
            <i className="material-icons" style={{ fontSize: 16 }}>file_upload</i>
            Local Video File
          </button>
          <button
            type="button"
            className={`upload-mode-btn ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => setActiveTab('url')}
          >
            <i className="material-icons" style={{ fontSize: 16 }}>link</i>
            Media URL / Stream
          </button>
        </div>
      </div>

      {/* TAB 1: FILE DROPZONE WITH CODEPEN SVG ANIMATION */}
      {activeTab === 'file' && (
        <div
          className="upload-dropzone-box"
          onClick={triggerFileSelect}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="codepen-svg-icon-wrap">
            <div className="codepen-svg-glow" />
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="codePenGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="codePenGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>

              {/* Orbit Ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="url(#codePenGrad1)"
                strokeWidth="3"
                strokeDasharray="12 8"
                className="svg-ring-orbit"
              />

              {/* Central Circle Base */}
              <circle cx="50" cy="50" r="32" fill="rgba(30, 27, 75, 0.85)" stroke="rgba(244, 114, 182, 0.4)" strokeWidth="2" />

              {/* Animated Floating Arrow */}
              <g className="svg-arrow-anim">
                <path
                  d="M50 28 L34 46 H44 V68 H56 V46 H66 Z"
                  fill="url(#codePenGrad2)"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </g>

              {/* Decorative Pulsing Particles */}
              <circle cx="28" cy="28" r="3" fill="#ec4899" opacity="0.8" />
              <circle cx="72" cy="32" r="2.5" fill="#38bdf8" opacity="0.8" />
              <circle cx="70" cy="70" r="3.5" fill="#a7f3d0" opacity="0.8" />
            </svg>
          </div>

          <div className="upload-title-text">
            {fileDetails ? `Selected: ${fileDetails.name}` : 'Drag & Drop your video file here'}
          </div>

          <div className="upload-subtitle-text">
            {fileDetails
              ? `Size: ${fileDetails.size} • Format: ${fileDetails.type} • Ready to stream`
              : 'Supports MP4, WebM, MOV, AVI, MKV (up to 4GB high-definition video)'}
          </div>

          <div className="upload-btn-chip">
            <i className="material-icons" style={{ fontSize: 18 }}>
              {fileDetails ? 'sync' : 'cloud_upload'}
            </i>
            {fileDetails ? 'Choose Different Video File' : 'Browse Local Files'}
          </div>
        </div>
      )}

      {/* TAB 2: URL INPUT */}
      {activeTab === 'url' && (
        <div className="url-input-container">
          <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
            Paste Direct Video Stream URL:
          </Typography>
          <input
            type="url"
            className="url-input-field"
            value={sourceValue}
            onChange={(e) => onSourceChange?.(e.target.value)}
            placeholder="https://example.com/stream-video.mp4"
          />
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Supports MP4, WebM, HLS, Google Drive, Dropbox, YouTube, and OneDrive public URLs.
          </Typography>
        </div>
      )}

      {/* FILE / STREAM CONFIRMATION BADGE */}
      {sourceValue && (
        <div className="selected-file-badge">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: '#22c55e', color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
              ✓
            </span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                Video Stream Ready
              </div>
              <div style={{ fontSize: '11px', color: '#86efac', maxWidth: 380, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {sourceValue}
              </div>
            </div>
          </div>

          <Chip
            label="Source Verified"
            size="small"
            sx={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontWeight: 700, border: '1px solid rgba(34, 197, 94, 0.4)' }}
          />
        </div>
      )}
    </div>
  )
}
