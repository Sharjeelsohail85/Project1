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
  dawn: 'brightness(0.95) contrast(1.15) sepia(0.35) saturate(1.5) hue-rotate(-15deg)',
  daytime: 'brightness(2.2) contrast(1.1) saturate(1.1) hue-rotate(168deg)',
  dusk: 'brightness(0.85) contrast(1.25) sepia(0.55) saturate(2.2) hue-rotate(-45deg)',
  sunset: 'brightness(0.85) contrast(1.25) sepia(0.55) saturate(2.2) hue-rotate(-45deg)',
  night: 'brightness(0.5) contrast(1.15) hue-rotate(179deg) saturate(1.3)',
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

  const effectiveMode = selectedMode === 'auto' ? currentAutoMode : selectedMode
  const activeFilter = FILTER_STYLES[effectiveMode] || FILTER_STYLES.daytime
  const isNightOrDusk = effectiveMode === 'night' || effectiveMode === 'dusk'

  const handleSelectMode = (mode) => {
    setSelectedMode(mode)
  }

  return (
    <section
      id="promoverlay"
      className={`promoverlay ${active ? 'active' : ''} ${isNightOrDusk ? 'is-night' : ''}`}
      aria-label="Promotional content"
      aria-hidden={!active}
    >
      {/* City Skyline Background Image with CSS filter */}
      <div
        className="promoverlay-bg"
        style={{
          filter: activeFilter,
          transition: 'filter 0.5s ease-in-out',
        }}
      />

      {/* Top Left Time & Theme Mode Bar */}
      <div className="promoverlay-night-wrap" role="group" aria-label="Background image mode controls">
        <label
          htmlFor="toggleNightCheckbox"
          className="promoverlay-night-label"
          title="Toggle Night mode"
        >
          <input
            id="toggleNightCheckbox"
            type="checkbox"
            checked={effectiveMode === 'night'}
            onChange={(e) => handleSelectMode(e.target.checked ? 'night' : 'daytime')}
          />
          <span>Night</span>
        </label>
        <span className="promoverlay-mode-divider" aria-hidden="true">|</span>
        <div className="promoverlay-mode-pills">
          <button
            type="button"
            className={`promoverlay-mode-pill ${effectiveMode === 'dawn' ? 'active' : ''}`}
            onClick={() => handleSelectMode('dawn')}
            title="Dawn filter"
          >
            Dawn
          </button>
          <button
            type="button"
            className={`promoverlay-mode-pill ${effectiveMode === 'daytime' ? 'active' : ''}`}
            onClick={() => handleSelectMode('daytime')}
            title="Daytime filter"
          >
            Day
          </button>
          <button
            type="button"
            className={`promoverlay-mode-pill ${effectiveMode === 'dusk' ? 'active' : ''}`}
            onClick={() => handleSelectMode('dusk')}
            title="Dusk / Sunset filter"
          >
            Dusk
          </button>
          <button
            type="button"
            className={`promoverlay-mode-pill ${effectiveMode === 'night' ? 'active' : ''}`}
            onClick={() => handleSelectMode('night')}
            title="Night filter"
          >
            Night
          </button>
          <button
            type="button"
            className={`promoverlay-mode-pill ${selectedMode === 'auto' ? 'active' : ''}`}
            onClick={() => handleSelectMode('auto')}
            title={`Auto sync (${currentAutoMode})`}
          >
            Auto
          </button>
        </div>
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
            className={`promoverlay-filter-btn ${selectedMode === 'auto' ? 'active' : ''}`}
            onClick={() => handleSelectMode('auto')}
          >
            <i className="material-icons" aria-hidden="true">schedule</i>
            Auto ({currentAutoMode.charAt(0).toUpperCase() + currentAutoMode.slice(1)})
          </button>

          <button
            type="button"
            className={`promoverlay-filter-btn ${effectiveMode === 'dawn' ? 'active' : ''}`}
            onClick={() => handleSelectMode('dawn')}
          >
            <i className="material-icons" aria-hidden="true">wb_twilight</i>
            Dawn
          </button>

          <button
            type="button"
            className={`promoverlay-filter-btn ${effectiveMode === 'daytime' ? 'active' : ''}`}
            onClick={() => handleSelectMode('daytime')}
          >
            <i className="material-icons" aria-hidden="true">wb_sunny</i>
            Daytime
          </button>

          <button
            type="button"
            className={`promoverlay-filter-btn ${(effectiveMode === 'dusk' || effectiveMode === 'sunset') ? 'active' : ''}`}
            onClick={() => handleSelectMode('dusk')}
          >
            <i className="material-icons" aria-hidden="true">wb_twilight</i>
            Dusk / Sunset
          </button>

          <button
            type="button"
            className={`promoverlay-filter-btn ${effectiveMode === 'night' ? 'active' : ''}`}
            onClick={() => handleSelectMode('night')}
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
