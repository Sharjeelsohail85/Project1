import { memo } from 'react'

const DailyInfo = memo(function DailyInfo() {
  return (
    <div id="dailyInfo" className="daily-info">
      {/* Channel Logo */}
      <div className="profile-logo">The Needle Drop</div>

      {/* Video Title */}
      <h1 id="dailyTitle" className="daily-info-title main-title daily-item">
        The Long Name of a Certain Video
      </h1>

      {/* Social Links */}
      <nav className="daily-info-leaks" aria-label="Social media links">
        <a id="link1" href="#" className="daily-info-link main-link daily-info-item">
          <i className="zmdi zmdi-rss" aria-hidden="true" />
          <span>Blog</span>
        </a>
        <a id="link2" href="#" className="daily-info-link main-link daily-info-item">
          <i className="zmdi zmdi-twitter" aria-hidden="true" />
          <span>Twitter</span>
        </a>
        <a id="link3" href="#" className="daily-info-link main-link daily-info-item">
          <i className="zmdi zmdi-youtube-play" aria-hidden="true" />
          <span>YouTube</span>
        </a>
        <a id="link4" href="#" className="daily-info-link main-link daily-info-item">
          <i className="zmdi zmdi-reddit" aria-hidden="true" />
          <span>reddit</span>
        </a>
      </nav>

      {/* User Info */}
      <div id="dailyUser" className="daily-info-user main-user daily-info-item">
        <i className="material-icons" aria-hidden="true">account_circle</i>
        <span>Username</span>
      </div>

      {/* View Count */}
      <div id="dailyViews" className="daily-info-views main-views daily-info-item">
        <i className="material-icons" aria-hidden="true">visibility</i>
        <span>15.4k</span>
      </div>

      {/* Rating */}
      <div id="dailyRating" className="daily-info-rating main-rating daily-info-item">
        <i className="material-icons" aria-hidden="true">thumbs_up_down</i>
        <span>8.4/10</span>
      </div>

      {/* Description */}
      <p id="dailyDesc" className="daily-info-desc main-desc daily-info-item">
        Ipsa et consequuntur voluptatem beatae quia et. Sunt temporibus deleniti ut culpa quisquam ullam. 
        Veritatis illo deleniti et eos maiores. Minima temporibus temporibus omnis facere quos sequi quam doloribus. 
        Quas ratione illo consequatur repellat tempore ad maxime itaque. Reiciendis est debitis id. 
        Commodi eaque assumenda consequatur quidem nemo provident.
      </p>

      {/* More Button */}
      <button id="dailyMore" className="daily-info-more daily-info-item">
        <i className="material-icons" aria-hidden="true">expand_more</i>
        <span>More</span>
      </button>

      {/* Label */}
      <div id="dailyLabel" className="daily-info-label daily-info-item">
        <i className="material-icons" aria-hidden="true">star_border</i>
        <span>Video of the Day</span>
      </div>

      {/* Archive Link */}
      <button id="dailyArchive" className="daily-info-archive daily-info-item">
        <i className="material-icons" aria-hidden="true">history</i>
        <span>Browse Archive</span>
      </button>
    </div>
  )
})

export default DailyInfo
