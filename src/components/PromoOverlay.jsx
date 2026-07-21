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
  dawn: 'brightness(0.92) contrast(1.15) hue-rotate(-25deg) sepia(0.3) saturate(1.3)',
  daytime: 'brightness(1.05) contrast(1.05) saturate(1.15)',
  sunset: 'brightness(0.82) contrast(1.2) hue-rotate(-50deg) saturate(1.85) sepia(0.4)',
  night: 'brightness(0.38) contrast(1.35) hue-rotate(185deg) invert(0.85) saturate(1.5)',
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
      className={`promoverlay ${active ? 'active' : ''}`}
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

      {/* Background Video */}
      <video
        ref={videoRef}
        playsInline
        muted
        loop
        preload="auto"
        poster="resources/photo.jpg"
        aria-hidden="true"
        style={{
          filter: activeFilter,
          transition: 'filter 0.5s ease-in-out',
          opacity: 0.15,
        }}
      >
        <source src="resources/ocean-video.webm" type="video/webm" />
      </video>

      {/* SVG Title Mask */}
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice">
          <defs>
            <mask id="mask" x="0" y="0" width="100%" height="100%">
              <rect x="0" y="0" width="100%" height="100%" />
              <text className="title" x="11" y="41">A Different</text>
              <text className="title" x="10" y="53">Way to Watch.</text>
            </mask>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" />
        </svg>
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
