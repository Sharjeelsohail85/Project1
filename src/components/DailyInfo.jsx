import { Fragment, memo, useMemo, useState } from 'react'

const FALLBACK_TITLE = 'The Long Name of a Certain Video'

const FALLBACK_DESCRIPTION = [
  'Ipsa et consequuntur voluptatem beatae quia et. Sunt temporibus deleniti ut culpa quisquam ullam.',
  'Veritatis illo deleniti et eos maiores. Minima temporibus temporibus omnis facere quos sequi quam doloribus.',
  'Quas ratione illo consequatur repellat tempore ad maxime itaque. Reiciendis est debitis id.',
  'Commodi eaque assumenda consequatur quidem nemo provident.',
].join(' ')

const LINK_REGEX = /((?:https?:\/\/|www\.)[^\s]+)/gi

function getSafeLink(urlLike) {
  const raw = String(urlLike || '')
  const cleaned = raw.replace(/[),.!?:;]+$/, '')
  if (!cleaned) return { href: '', label: '', trailing: raw }

  const trailing = raw.slice(cleaned.length)
  const href = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`
  return { href, label: cleaned, trailing }
}

function parseTextWithLinks(text) {
  const value = String(text || '')
  if (!value) return []

  const parts = []
  let lastIndex = 0
  let match

  while ((match = LINK_REGEX.exec(value)) !== null) {
    const start = match.index
    const token = match[0]

    if (start > lastIndex) {
      parts.push({ type: 'text', value: value.slice(lastIndex, start) })
    }

    const { href, label, trailing } = getSafeLink(token)
    if (href) {
      parts.push({ type: 'link', href, label })
      if (trailing) {
        parts.push({ type: 'text', value: trailing })
      }
    } else {
      parts.push({ type: 'text', value: token })
    }

    lastIndex = start + token.length
  }

  if (lastIndex < value.length) {
    parts.push({ type: 'text', value: value.slice(lastIndex) })
  }

  return parts
}

function LinkedText({ text, keyPrefix = 'linked' }) {
  const parts = useMemo(() => parseTextWithLinks(text), [text])

  return (
    <>
      {parts.map((part, index) => {
        const key = `${keyPrefix}-${index}`
        if (part.type === 'link') {
          return (
            <a key={key} href={part.href} target="_blank" rel="noreferrer noopener">
              {part.label}
            </a>
          )
        }

        return <Fragment key={key}>{part.value}</Fragment>
      })}
    </>
  )
}

const DailyInfo = memo(function DailyInfo({ currentVideoSource = {} }) {
  const [expanded, setExpanded] = useState(false)

  const title = String(currentVideoSource?.title || '').trim() || FALLBACK_TITLE
  const description = String(currentVideoSource?.description || '').trim() || FALLBACK_DESCRIPTION
  const discussionLink = String(currentVideoSource?.discussionLink || '').trim()
  const shouldShowMore = description.length > 170 || Boolean(discussionLink)

  const handleToggleMore = () => {
    setExpanded((prev) => !prev)
  }

  return (
    <div id="dailyInfo" className={`daily-info ${expanded ? 'is-expanded' : ''}`}>
      {/* Channel Logo */}
      <div className="profile-logo">The Needle Drop</div>

      {/* Video Title */}
      <h1 id="dailyTitle" className="daily-info-title main-title daily-item">
        {title}
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
      <p id="dailyDesc" className={`daily-info-desc main-desc daily-info-item ${expanded ? 'is-expanded' : 'is-collapsed'}`}>
        <LinkedText text={description} keyPrefix="daily-desc" />
      </p>

      {expanded && discussionLink ? (
        <p className="daily-info-desc-link-row daily-info-item">
          <span>Discussion: </span>
          <LinkedText text={discussionLink} keyPrefix="daily-discussion" />
        </p>
      ) : null}

      {/* More Button */}
      {shouldShowMore ? (
        <button
          id="dailyMore"
          className="daily-info-more daily-info-item"
          type="button"
          onClick={handleToggleMore}
          aria-expanded={expanded}
          aria-controls="dailyDesc"
        >
          <i className="material-icons" aria-hidden="true">{expanded ? 'expand_less' : 'expand_more'}</i>
          <span>{expanded ? 'Less' : 'More'}</span>
        </button>
      ) : null}

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
