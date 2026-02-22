import { memo, useCallback, useEffect, useRef, useState } from 'react'
import VideoPlayer from './VideoPlayer'
import DailyInfo from './DailyInfo'
import DailyComments from './DailyComments'

const Daily = memo(function Daily({
  active,
  currentVideoSource,
  theaterMode,
  onToggleDaily,
  onGoTheater,
  onCommentsToggle,
  onHideOverlays,
  themeColor
}) {
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const commentsLoadingTimerRef = useRef(null)
  const dailyClasses = `daily ${active ? 'active' : ''} profile ${theaterMode ? 'alternate' : ''} ${commentsOpen ? 'comments-open' : ''}`

  const handleToggleDaily = useCallback(() => {
    onToggleDaily?.()
  }, [onToggleDaily])

  const handleGoTheater = useCallback(() => {
    onGoTheater?.()
  }, [onGoTheater])

  const clearCommentsLoadingTimer = useCallback(() => {
    if (commentsLoadingTimerRef.current) {
      clearTimeout(commentsLoadingTimerRef.current)
      commentsLoadingTimerRef.current = null
    }
  }, [])

  const startCommentsLoading = useCallback(() => {
    clearCommentsLoadingTimer()
    setCommentsLoading(true)

    commentsLoadingTimerRef.current = setTimeout(() => {
      setCommentsLoading(false)
      commentsLoadingTimerRef.current = null
    }, 1400)
  }, [clearCommentsLoadingTimer])

  const handleToggleComments = useCallback(() => {
    setCommentsOpen((previous) => {
      const next = !previous

      if (next) {
        startCommentsLoading()
      } else {
        clearCommentsLoadingTimer()
        setCommentsLoading(false)
      }

      return next
    })
  }, [clearCommentsLoadingTimer, startCommentsLoading])

  const handleCloseComments = useCallback(() => {
    clearCommentsLoadingTimer()
    setCommentsOpen(false)
    setCommentsLoading(false)
  }, [clearCommentsLoadingTimer])

  useEffect(() => {
    if (!active) {
      clearCommentsLoadingTimer()
      setCommentsOpen(false)
      setCommentsLoading(false)
    }
  }, [active, clearCommentsLoadingTimer])

  useEffect(() => {
    onCommentsToggle?.(commentsOpen)
  }, [commentsOpen, onCommentsToggle])

  useEffect(() => {
    return () => {
      clearCommentsLoadingTimer()
      onCommentsToggle?.(false)
    }
  }, [clearCommentsLoadingTimer, onCommentsToggle])

  return (
    <section
      id="daily"
      className={dailyClasses}
      aria-label="Video player section"
    >
      {/* Background Video */}
      <video
        id="profileBackground"
        muted
        loop
        className="profile-background"
        preload="auto"
        poster="resources/video-thumbnail.jpg"
        autoPlay
        aria-hidden="true"
      >
        <source src="resources/video.mp4" type="video/mp4" />
      </video>

      {/* Close Button */}
      <button
        id="dailyClose"
        className="promoverlay-close button-float active"
        onClick={handleToggleDaily}
        aria-label="Close video player"
      >
        <i className="material-icons" aria-hidden="true">close</i>
      </button>

      {/* Theater Mode Button */}
      <button
        id="dailyFull"
        className="promoverlay-next button-float active"
        onClick={handleGoTheater}
        aria-label={theaterMode ? 'Exit theater mode' : 'Enter theater mode'}
        aria-pressed={theaterMode}
      >
        <i className="material-icons" aria-hidden="true">
          panorama_horizontal
        </i>
      </button>

      {/* Comments Button */}
      <button
        id="dailyComment"
        className={`daily-comment button-float active ${commentsOpen ? 'active-comments' : ''}`}
        onClick={handleToggleComments}
        aria-label="View comments"
        aria-pressed={commentsOpen}
      >
        <i className="material-icons" aria-hidden="true">comment</i>
      </button>

      {/* Subscribe Button */}
      <button
        id="dailySub"
        className="daily-sub button-float active"
        aria-label="Subscribe"
      >
        <i className="material-icons" aria-hidden="true">add_alert</i>
      </button>

      {/* External Comments Button */}
      <button
        id="externalComments"
        className="daily-external button-float active"
        aria-label="View Reddit thread"
      >
        <i className="zmdi zmdi-reddit" aria-hidden="true" />
        <span id="externalCommentsLabel" className="daily-sub-label button-float-label">
          <span className="extSource">reddit</span> thread
        </span>
      </button>

      {/* Video Player */}
      <VideoPlayer
        currentVideoSource={currentVideoSource}
        onGoTheater={onGoTheater}
        onHideOverlays={onHideOverlays}
        themeColor={themeColor}
        theaterMode={theaterMode}
      />

      {/* Video Info */}
      <DailyInfo currentVideoSource={currentVideoSource} />

      {/* Comments Section */}
      <DailyComments active={commentsOpen} loading={commentsLoading} onClose={handleCloseComments} />
    </section>
  )
})

export default Daily
