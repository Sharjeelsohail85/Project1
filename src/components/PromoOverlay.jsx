import { memo, useRef, useEffect, useState } from 'react'

const PROMO_SLIDES = [
  {
    id: 'promoverlay1',
    content: 'Octopussol is a video platform to upload, migrate,<br/>organize, and stream creator content in one place.'
  },
  {
    id: 'promoverlay3',
    content: 'Discover new videos, follow channels,<br/>and watch content from creators worldwide.'
  },
  {
    id: 'promoverlay4',
    content: 'Sign in to publish videos, manage your channel,<br/>and handle your content from one dashboard.'
  },
  {
    id: 'promoverlay2',
    content: 'Built for creators: keep control of your uploads,<br/>metadata, and distribution settings.'
  }
]

function getAutoTimeMode() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 8) return 'dawn'
  if (hour >= 8 && hour < 17) return 'daytime'
  if (hour >= 17 && hour < 20) return 'sunset'
  return 'night'
}

const FILTER_STYLES = {
  dawn: 'brightness(0.9) contrast(1.15) sepia(0.35) saturate(1.4) hue-rotate(-15deg)',
  daytime: 'brightness(2.4) contrast(1.1) hue-rotate(168deg)',
  sunset: 'brightness(0.8) contrast(1.25) sepia(0.5) saturate(2.0) hue-rotate(-45deg)',
  night: 'brightness(0.5) contrast(1.1) hue-rotate(179deg)',
}

const PromoOverlay = memo(function PromoOverlay({
  active,
  isAuthenticated = false,
  currentSlide,
  onHidePromo,
  onNextPromo,
  onShowSignup,
  onShowLogin
}) {
  const videoRef = useRef(null)
  const [selectedMode, setSelectedMode] = useState('auto')
  const [isNightToggled, setIsNightToggled] = useState(false)
  const [currentAutoMode, setCurrentAutoMode] = useState(() => getAutoTimeMode())
  const [currentTimeString, setCurrentTimeString] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTimeString(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).toLowerCase()
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const updateAutoMode = () => {
      setCurrentAutoMode(getAutoTimeMode())
    }
    updateAutoMode()
    const interval = setInterval(updateAutoMode, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (active) {
      video.play().catch((err) => {
        console.log('Promo video autoplay blocked or interrupted:', err)
      })
    } else {
      video.pause()
    }
  }, [active])

  const effectiveMode = isNightToggled
    ? 'night'
    : selectedMode === 'auto'
      ? currentAutoMode
      : selectedMode

  const activeFilter = FILTER_STYLES[effectiveMode] || FILTER_STYLES.daytime

  return (
    <section
      id="promoverlay"
      className={`promoverlay ${active ? 'active' : ''} ${effectiveMode === 'night' ? 'is-night' : ''}`}
      aria-label="Promotional content"
      aria-hidden={!active}
    >
      {/* City Skyline Background Image (CodePen exact design) with CSS filter */}
      <div
        className="promoverlay-bg"
        style={{
          filter: activeFilter,
          transition: 'filter 0.5s ease-in-out',
        }}
      />

      {/* Top Left Toggle Night Control */}
      <div className="promoverlay-night-wrap">
        <label htmlFor="toggleNightCheckbox" className="promoverlay-night-label">
          <input
            id="toggleNightCheckbox"
            type="checkbox"
            checked={isNightToggled}
            onChange={(e) => setIsNightToggled(e.target.checked)}
          />
          <span>Toggle night</span>
        </label>
      </div>

      {/* Center Live Digital Clock (matching CodePen design) */}
      <div className="promoverlay-clock" aria-label="Current time">
        {currentTimeString}
      </div>

      {/* Slide Container - right side text + buttons */}
      <div id="promoverlaySlideContainer" className="promoverlay-slide-container">
        {PROMO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            id={slide.id}
            className={`promoverlay-slide ${index === currentSlide ? 'active' : ''}`}
          >
            <p
              className="promoverlay-desc"
              dangerouslySetInnerHTML={{ __html: slide.content }}
            />
          </div>
        ))}
        {!isAuthenticated ? (
          <>
            <div className="promoverlay-button-row" role="group" aria-label="Authentication actions">
              <button
                id="promoverlaySignup"
                className="promoverlay-signup promoverlay-button button-flat"
                onClick={() => onShowSignup?.()}
              >
                <i className="material-icons" aria-hidden="true">person_add</i>
                Sign Up
              </button>
              <button
                id="promoverlayLogin"
                className="promoverlay-login promoverlay-button button-flat"
                onClick={() => onShowLogin?.()}
              >
                <i className="material-icons" aria-hidden="true">exit_to_app</i>
                Log In
              </button>
            </div>

            <div className="promoverlay-legal-links" aria-label="Legal links">
              <a href="/privacy-policy.html">Privacy Policy</a>
              <span aria-hidden="true"> • </span>
              <a href="/terms-and-conditions.html">Terms &amp; Conditions</a>
            </div>
          </>
        ) : null}
      </div>

      {/* Left-side tagline under the SVG title + Filter selector bar */}
      <div className="promoverlay-tagline">
        <strong className="promoverlay-tagline-bold">
          Octopussol helps creators upload, migrate, and stream videos.
        </strong>
        <span className="promoverlay-tagline-sub">Use Search to discover videos and Post to publish your own content.</span>

        {/* Time-sensitive filter mode buttons */}
        <div className="promoverlay-filter-bar" role="group" aria-label="Background time filters">
          <button
            type="button"
            className={`promoverlay-filter-btn ${selectedMode === 'auto' && !isNightToggled ? 'active' : ''}`}
            onClick={() => {
              setSelectedMode('auto')
              setIsNightToggled(false)
            }}
          >
            <i className="material-icons" aria-hidden="true">schedule</i>
            Auto ({currentAutoMode.charAt(0).toUpperCase() + currentAutoMode.slice(1)})
          </button>

          <button
            type="button"
            className={`promoverlay-filter-btn ${selectedMode === 'dawn' && !isNightToggled ? 'active' : ''}`}
            onClick={() => {
              setSelectedMode('dawn')
              setIsNightToggled(false)
            }}
          >
            <i className="material-icons" aria-hidden="true">wb_twilight</i>
            Dawn
          </button>

          <button
            type="button"
            className={`promoverlay-filter-btn ${selectedMode === 'daytime' && !isNightToggled ? 'active' : ''}`}
            onClick={() => {
              setSelectedMode('daytime')
              setIsNightToggled(false)
            }}
          >
            <i className="material-icons" aria-hidden="true">wb_sunny</i>
            Daytime
          </button>

          <button
            type="button"
            className={`promoverlay-filter-btn ${selectedMode === 'sunset' && !isNightToggled ? 'active' : ''}`}
            onClick={() => {
              setSelectedMode('sunset')
              setIsNightToggled(false)
            }}
          >
            <i className="material-icons" aria-hidden="true">wb_twilight</i>
            Sunset
          </button>

          <button
            type="button"
            className={`promoverlay-filter-btn ${(selectedMode === 'night' || isNightToggled) ? 'active' : ''}`}
            onClick={() => {
              setSelectedMode('night')
              setIsNightToggled(true)
            }}
          >
            <i className="material-icons" aria-hidden="true">nights_stay</i>
            Night
          </button>
        </div>
      </div>

      {/* User Attribution */}
      <div id="promoverlayUser" className="promoverlay-user">
        <span className="promoverlay-user-caption">Video by</span>
        <span className="promoverlay-user-name">Username</span>
      </div>

      {/* Close Button */}
      <button
        id="promoverlayClose"
        className="promoverlay-close button-float active"
        onClick={() => onHidePromo?.()}
        aria-label="Close promotional overlay"
      >
        <i className="material-icons" aria-hidden="true">close</i>
      </button>

      {/* Next Slide Button */}
      <button
        id="promoverlayNext"
        className="promoverlay-next button-float active"
        onClick={() => onNextPromo?.()}
        aria-label="Next slide"
      >
        <i className="material-icons" aria-hidden="true">navigate_next</i>
      </button>
    </section>
  )
})

export default PromoOverlay
