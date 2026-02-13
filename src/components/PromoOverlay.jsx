import { memo } from 'react'

const PROMO_SLIDES = [
  {
    id: 'promoverlay1',
    content: '[Sitename] collects videos from all around the<br/>internet and sorts them a managable way.'
  },
  {
    id: 'promoverlay3',
    content: "[Sitename] won't censor or demonotize<br/>you. Only international law is enforced."
  },
  {
    id: 'promoverlay4',
    content: "[Sitename] makes dual-citizenship easy. Login<br/>with YouTube, and we'll post here for you."
  },
  {
    id: 'promoverlay2',
    content: '[Sitename] gives 100% of ad revenue<br/>to creators -- <a href="#">learn how it works</a>.'
  }
]

const PromoOverlay = memo(function PromoOverlay({
  active,
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
      </div>

      {/* Left-side tagline under the SVG title */}
      <div className="promoverlay-tagline">
        <strong className="promoverlay-tagline-bold">
          We don't own the content, you do.
        </strong>
        <span className="promoverlay-tagline-sub">Things are nicer that way.</span>
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
