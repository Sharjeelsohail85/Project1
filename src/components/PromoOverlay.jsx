import { memo } from 'react'

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

const PromoOverlay = memo(function PromoOverlay({
  active,
  isAuthenticated = false,
  currentSlide,
  onHidePromo,
  onNextPromo,
  onShowSignup,
  onShowLogin
}) {
  return (
    <section
      id="promoverlay"
      className={`promoverlay ${active ? 'active' : ''}`}
      aria-label="Promotional content"
      aria-hidden={!active}
    >
      {/* Background Video */}
      <video
        autoPlay
        playsInline
        muted
        loop
        preload="auto"
        poster="resources/ocean-thumbnail.jpg"
        aria-hidden="true"
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

      {/* Left-side tagline under the SVG title */}
      <div className="promoverlay-tagline">
        <strong className="promoverlay-tagline-bold">
          Octopussol helps creators upload, migrate, and stream videos.
        </strong>
        <span className="promoverlay-tagline-sub">Use Search to discover videos and Post to publish your own content.</span>
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
