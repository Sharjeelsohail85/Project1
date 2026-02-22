import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useVideoPlayer, formatTime } from '../hooks/useVideoPlayer'
import { resolvePlaybackSource } from '../utils/videoSource'

const noop = () => {}

const SPEED_OPTIONS = [
  { value: 2, label: '2x' },
  { value: 1.5, label: '1.5x' },
  { value: 1.25, label: '1.25x' },
  { value: 1, label: 'Normal' },
  { value: 0.5, label: '0.5x' },
  { value: 0.25, label: '0.25x' }
]

const QUALITY_OPTIONS = [1080, 720, 480, 360, 240, 144, 0]

const PROVIDER_LABELS = Object.freeze({
  youtube: 'YouTube',
  google: 'Google Drive',
  facebook: 'Facebook',
  dropbox: 'Dropbox',
  direct: 'Direct link',
  external: 'External provider',
})

const VideoPlayer = memo(function VideoPlayer({
  currentVideoSource,
  onGoTheater = noop,
  onHideOverlays = noop,
  themeColor = '#673AB7',
  theaterMode = false
}) {
  const playbackSource = resolvePlaybackSource(currentVideoSource)
  const isEmbedSource = playbackSource.mode === 'iframe'
  const sourceToken = `${playbackSource.mode}|${playbackSource.src}`
  const [playerError, setPlayerError] = useState('')
  const [embedLoaded, setEmbedLoaded] = useState(false)

  const providerLabel = useMemo(() => {
    return PROVIDER_LABELS[playbackSource.provider] || 'External provider'
  }, [playbackSource.provider])

  const fallbackUrl = playbackSource.openUrl || playbackSource.src

  useEffect(() => {
    setPlayerError('')
    setEmbedLoaded(false)
  }, [sourceToken])

  const api = useVideoPlayer({
    onGoTheater,
    onHideOverlays,
    themeColor,
    theaterMode,
    sourceToken,
    disableNativePlayback: isEmbedSource,
  })
  const {
    refs: { playerRef, playerBackgroundRef, containerRef, progressHolderRef },
    state: {
      pending,
      currentTime,
      duration,
      progressPct,
      bufferedPct,
      volume,
      playbackRate,
      showControls,
      showSpeedPopup,
      showCaptionsPopup,
      showQualityPopup,
      notice,
      progressHover,
      scrubTime,
      scrubPct,
      playIcon,
      volumeIconDown,
      speedActive,
      qualityActive,
      isLoading
    },
    actions: {
      togglePlay,
      forcePlay,
      setVolume,
      setPlaybackRate,
      setQuality,
      requestFullscreen,
      handleTheater,
      seekByClick,
      handleProgressMove,
      handleProgressLeave,
      hidePopups,
      setShowSpeedPopup,
      setShowCaptionsPopup,
      setShowQualityPopup,
      onContainerMouseMove,
      onContainerMouseLeave
    }
  } = api

  const handleContainerClick = useCallback(() => {
    if (pending) forcePlay()
  }, [pending, forcePlay])

  const handleDoubleClick = useCallback(() => {
    requestFullscreen()
  }, [requestFullscreen])

  const handleVideoClick = useCallback((e) => {
    e.stopPropagation()
    togglePlay()
  }, [togglePlay])

  const handleNativeError = useCallback(() => {
    setPlayerError(`This ${providerLabel} video could not be streamed in-app.`)
  }, [providerLabel])

  const isIconName = (s) => typeof s === 'string' && s.length < 30 && /^[a-z_0-9]+$/i.test(s)

  const timeText = duration
    ? (progressHover && scrubTime != null
        ? `${formatTime(scrubTime)} / ${formatTime(duration)}`
        : `${formatTime(currentTime)} / ${formatTime(duration)}`)
    : 'Loading...'

  return (
    <div id="dailyPlayer" className="daily-player player">
      <div
        id="playerContainer"
        ref={containerRef}
        className={pending ? 'pending' : ''}
        onMouseMove={onContainerMouseMove}
        onMouseLeave={onContainerMouseLeave}
        onClick={handleContainerClick}
        onDoubleClick={handleDoubleClick}
      >
        <video
          ref={playerRef}
          id="player"
          preload="auto"
          poster="resources/video-thumbnail.jpg"
          playsInline
          onClick={handleVideoClick}
          onError={handleNativeError}
          style={isEmbedSource ? { display: 'none' } : undefined}
        >
          <source src={isEmbedSource ? '' : playbackSource.src} />
          <track id="subtitles" label="English" kind="subtitles" srcLang="en" src="" default />
        </video>
        <video
          ref={playerBackgroundRef}
          id="playerBackground"
          className="player-background"
          preload="auto"
          poster="resources/video-thumbnail.jpg"
          muted
          playsInline
          aria-hidden="true"
          style={isEmbedSource ? { display: 'none' } : undefined}
        >
          <source src={isEmbedSource ? '' : playbackSource.src} />
        </video>

        {isEmbedSource ? (
          <iframe
            key={sourceToken}
            id="playerEmbed"
            title={playbackSource.title || 'External video player'}
            src={playbackSource.src}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            onLoad={() => setEmbedLoaded(true)}
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ position: 'relative', zIndex: 6, width: '100%', height: '100%', border: 0, borderRadius: 2 }}
          />
        ) : null}

        {isEmbedSource && fallbackUrl ? (
          <div
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              maxWidth: 'min(92%, 560px)',
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(0, 0, 0, 0.62)',
              color: '#fff',
              fontSize: 12,
              lineHeight: 1.35,
            }}
          >
            <span>
              {embedLoaded
                ? `${providerLabel} embed loaded. If playback is blocked, open source.`
                : `Loading ${providerLabel} embed. If it does not play, open source.`}
            </span>
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline', whiteSpace: 'nowrap' }}
            >
              Open source
            </a>
          </div>
        ) : null}

        {playerError ? (
          <div
            role="status"
            style={{
              position: 'absolute',
              left: 12,
              right: 12,
              bottom: 12,
              zIndex: 10,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(183, 28, 28, 0.88)',
              color: '#fff',
              fontSize: 12,
              lineHeight: 1.35,
            }}
          >
            {playerError}
            {fallbackUrl ? (
              <>
                {' '}
                <a
                  href={fallbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}
                >
                  Open source
                </a>
              </>
            ) : null}
          </div>
        ) : null}

        {/* Controls */}
        <div
          id="controls"
          className={`controls ${showControls && !isEmbedSource ? '' : 'hidden'}`}
          role="group"
          aria-label="Video controls"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            ref={progressHolderRef}
            id="progressholder"
            className="progressholder"
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
            onMouseMove={handleProgressMove}
            onMouseLeave={handleProgressLeave}
            onMouseUp={(e) => { if (progressHolderRef.current) seekByClick(e); }}
          >
            <div id="buffered" style={{ width: `${bufferedPct}%` }} />
            <div
              id="progressScrub"
              style={{
                width: `${progressHover ? scrubPct : progressPct}%`,
                opacity: progressHover ? 1 : 0
              }}
            />
            <div id="progress" style={{ width: `${progressPct}%` }} />
            <div
              id="progressorb"
              style={{ left: `${progressHover ? scrubPct : progressPct}%` }}
            >
              <div id="progressorbChild" />
            </div>
          </div>

          <div id="controlsLeft" className="controls-container">
            <button
              id="playpause"
              type="button"
              className="player-button material-icons"
              onClick={handleVideoClick}
              aria-label={playIcon === 'pause' ? 'Pause' : playIcon === 'replay' ? 'Replay' : 'Play'}
            >
              {playIcon}
            </button>
            <div id="volumeWrap">
              <button
                id="volumeDown"
                type="button"
                className={`player-button material-icons ${volume <= 0 ? 'active' : ''}`}
                onClick={() => setVolume(volume - 0.1)}
                aria-label="Volume down"
              >
                {volumeIconDown}
              </button>
              <span id="volume" className="volume-count" aria-live="polite">
                {Math.round(volume * 10)}
              </span>
              <button
                id="volumeUp"
                type="button"
                className={`player-button material-icons ${volume >= 1 ? 'active' : ''}`}
                onClick={() => setVolume(volume + 0.1)}
                aria-label="Volume up"
              >
                volume_up
              </button>
            </div>
            <div id="progresstime" aria-live="polite">{timeText}</div>
          </div>

          <div id="controlsRight" className="controls-container">
            <button
              id="speed"
              type="button"
              className={`player-button material-icons ${speedActive ? 'active' : ''}`}
              onClick={() => { setShowSpeedPopup((v) => !v); setShowCaptionsPopup(false); setShowQualityPopup(false); }}
              aria-label="Speed"
              aria-expanded={showSpeedPopup}
            >
              timer
            </button>
            <button
              id="captions"
              type="button"
              className="player-button material-icons"
              onClick={() => { setShowCaptionsPopup((v) => !v); setShowSpeedPopup(false); setShowQualityPopup(false); }}
              aria-label="Captions"
              aria-expanded={showCaptionsPopup}
            >
              subtitles
            </button>
            <button
              id="quality"
              type="button"
              className={`player-button material-icons ${qualityActive ? 'active' : ''}`}
              onClick={() => { setShowQualityPopup((v) => !v); setShowSpeedPopup(false); setShowCaptionsPopup(false); }}
              aria-label="Quality"
              aria-expanded={showQualityPopup}
            >
              high_quality
            </button>
            <button
              id="theater"
              type="button"
              className="player-button material-icons"
              onClick={handleTheater}
              aria-label="Theater mode"
            >
              swap_horizontal
            </button>
            <button
              id="fullscreen"
              type="button"
              className="player-button material-icons"
              onClick={requestFullscreen}
              aria-label="Fullscreen"
            >
              fullscreen
            </button>
          </div>

          {showSpeedPopup && (
            <div id="speedPopup" className="player-popup" role="menu">
              <div className="player-popup-head">
                <i className="material-icons" aria-hidden="true">timer</i> Speed
              </div>
              {SPEED_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`player-popup-entry ${playbackRate === value ? 'active' : ''}`}
                  onClick={() => setPlaybackRate(value)}
                  role="menuitem"
                >
                  <i className="material-icons" aria-hidden="true">fiber_manual_record</i> {label}
                </button>
              ))}
            </div>
          )}

          {showCaptionsPopup && (
            <div id="captionsPopup" className="player-popup" role="menu">
              <div className="player-popup-head">
                <i className="material-icons" aria-hidden="true">subtitles</i> Captions
              </div>
              <button type="button" className="player-popup-entry" role="menuitem">
                <i className="material-icons" aria-hidden="true">language</i> English
              </button>
              <button type="button" className="player-popup-entry active" role="menuitem">
                <i className="material-icons" aria-hidden="true">clear</i> None
              </button>
            </div>
          )}

          {showQualityPopup && (
            <div id="qualityPopup" className="player-popup" role="menu">
              <div className="player-popup-head">
                <i className="material-icons" aria-hidden="true">high_quality</i> Quality
              </div>
              {QUALITY_OPTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  className={`player-popup-entry ${q === 720 ? 'quality-720' : ''} ${q === 1080 ? 'quality-1080' : ''}`}
                  onClick={() => setQuality(q)}
                  role="menuitem"
                >
                  {q === 0 ? 'Auto' : `${q}p`}
                </button>
              ))}
            </div>
          )}

          <div id="nextUp" className="nextup" aria-hidden="true">
            <div className="nextup-frame" />
            <div className="nextup-title" />
            <div className="nextup-time" />
            <div className="nextup-progress" />
          </div>
        </div>

        <div id="loaderContainer" className={`loader-container ${isLoading ? 'visible' : ''}`} aria-label="Loading" role="status">
          <div className="loader" id="loader-one" />
          <div className="loader" id="loader-two" />
          <div className="loader" id="loader-three" />
        </div>

        <div id="noticeContainer" className="notice-container" aria-live="polite">
          {notice && (
            <div
              className={`notice ${isIconName(notice) ? 'material-icons' : ''}`}
              id="notice"
            >
              {notice}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default VideoPlayer
