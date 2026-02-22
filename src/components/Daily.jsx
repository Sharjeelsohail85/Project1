import { memo, useCallback, useEffect, useState } from 'react'
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
  const dailyClasses = `daily ${active ? 'active' : ''} profile ${theaterMode ? 'alternate' : ''} ${commentsOpen ? 'comments-open' : ''}`

  const handleToggleDaily = useCallback(() => {
    onToggleDaily?.()
  }, [onToggleDaily])

  const handleGoTheater = useCallback(() => {
    onGoTheater?.()
  }, [onGoTheater])

  const handleToggleComments = useCallback(() => {
    setCommentsOpen((previous) => !previous)
  }, [])

  const handleCloseComments = useCallback(() => {
    setCommentsOpen(false)
  }, [])

  useEffect(() => {
    if (!active) {
      setCommentsOpen(false)
    }
  }, [active])

  useEffect(() => {
    onCommentsToggle?.(commentsOpen)
  }, [commentsOpen, onCommentsToggle])

  useEffect(() => {
    return () => {
      onCommentsToggle?.(false)
    }
  }, [onCommentsToggle])

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
          {theaterMode ? 'close_fullscreen' : 'panorama_horizontal'}
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
      <DailyInfo />

      {/* Comments Section */}
      <DailyComments active={commentsOpen} onClose={handleCloseComments} />
    </section>
  )
})

export default Daily
