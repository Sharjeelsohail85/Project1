import { memo, useCallback } from 'react'
import VideoPlayer from './VideoPlayer'
import DailyInfo from './DailyInfo'
import DailyComments from './DailyComments'

const Daily = memo(function Daily({
  active,
  theaterMode,
  onToggleDaily,
  onGoTheater,
  onHideOverlays,
  themeColor
}) {
  const dailyClasses = `daily ${active ? 'active' : ''} profile ${theaterMode ? 'alternate' : ''}`

  const handleToggleDaily = useCallback(() => {
    onToggleDaily?.()
  }, [onToggleDaily])

  const handleGoTheater = useCallback(() => {
    onGoTheater?.()
  }, [onGoTheater])

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
        className="daily-close button-float active"
        onClick={handleToggleDaily}
        aria-label="Close video player"
      >
        <i className="material-icons" aria-hidden="true">close</i>
        <span className="button-float-label bottom">Close</span>
      </button>

      {/* Theater Mode Button */}
      <button
        id="dailyFull"
        className="daily-full button-float active"
        onClick={handleGoTheater}
        aria-label="Enter theater mode"
      >
        <i className="material-icons" aria-hidden="true">panorama_horizontal</i>
        <span className="button-float-label bottom">Theater Mode</span>
      </button>

      {/* Comments Button */}
      <button
        id="dailyComment"
        className="daily-comment button-float active"
        onClick={handleGoTheater}
        aria-label="View comments"
      >
        <i className="material-icons" aria-hidden="true">comments</i>
        <span className="button-float-label top">Comments</span>
      </button>

      {/* Subscribe Button */}
      <button
        id="dailySub"
        className="daily-sub button-float active"
        aria-label="Subscribe"
      >
        <i className="material-icons" aria-hidden="true">add_alert</i>
        <span className="button-float-label top">Subscribe</span>
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
        onGoTheater={onGoTheater}
        onHideOverlays={onHideOverlays}
        themeColor={themeColor}
        theaterMode={theaterMode}
      />

      {/* Video Info */}
      <DailyInfo />

      {/* Comments Section */}
      <DailyComments />
    </section>
  )
})

export default Daily
