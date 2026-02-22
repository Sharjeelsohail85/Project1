import { memo } from 'react'
import './DailyComments.css'

const COMMENT_ITEMS = [
  {
    id: 'retro-1',
    name: 'Arbaoui Mehdi',
    role: 'ceo & founder depot webdesigner',
    avatar: 'http://farm5.staticflickr.com/4136/4817542998_55a7eb8d8b_q.jpg',
    body:
      'Etiam iaculis, ipsum sit amet scelerisque dictum, diam justo suscipit mauris, a lacinia odio nulla et tellus. Praesent placerat ipsum sed purus rutrum vel dapibus magna scelerisque.',
    linkHref: 'https://www.depotwebdesigner.com',
    linkLabel: 'http://www.depotwebdesigner.com',
  },
  {
    id: 'retro-2',
    name: 'Edmundo I Jacobi',
    role: 'webdeveloper',
    avatar: 'http://farm3.staticflickr.com/2721/4531285963_cd28f61b16_q.jpg',
    body:
      'Lorem ipsum non minim Excepteur Duis sunt labore ut laborum sit ullamco sed ex. Lorem ipsum dolor adipisicing ullamco cillum in occaecat adipisicing ullamco cillum in occaecat proident commodo.',
    linkHref: 'https://www.google.com',
    linkLabel: 'https://www.google.com',
  },
  {
    id: 'retro-3',
    name: 'Lisa J Escoto',
    role: 'webdesigner',
    avatar: 'http://farm3.staticflickr.com/2617/3873098259_61c446da22_q.jpg',
    body:
      'Phasellus pharetra libero sed egestas condimentum ligula nibh cursus turpis, sed convallis odio lorem sit amet ligula. Suspendisse dapibus nibh nec augue placerat eleifend sit amet nec purus.',
    linkHref: 'https://codepen.io/arbaoui_mehdi/full/ANGYmV',
    linkLabel: 'https://codepen.io/arbaoui_mehdi/full/ANGYmV',
  },
]

const SOCIAL_LINKS = [
  { id: 'twitter', label: '@webodream', href: 'https://twitter.com/webodream', iconClass: 'zmdi zmdi-twitter' },
  {
    id: 'facebook',
    label: 'depot.webdesigner',
    href: 'https://www.facebook.com/groups/115089745169149',
    iconClass: 'zmdi zmdi-facebook',
  },
  { id: 'github', label: '@arbaoui-mehdi', href: 'https://github.com/arbaoui-mehdi', iconClass: 'zmdi zmdi-github' },
]

const DailyComments = memo(function DailyComments({ active = false, loading = false, onClose }) {
  const skeletonRows = [1, 2, 3, 4, 5]

  const renderLoading = () => (
    <div className="comments-loading" role="status" aria-live="polite" aria-label="Loading comments">
      {skeletonRows.map((item) => (
        <div key={`comments-loading-${item}`} className="comments-loading-row">
          <span className="comments-loading-avatar" aria-hidden="true" />
          <div className="comments-loading-lines" aria-hidden="true">
            <span className="comments-loading-line comments-loading-line-title" />
            <span className="comments-loading-line comments-loading-line-meta" />
            <span className="comments-loading-line comments-loading-line-body" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <section
      className={`daily-comments ${active ? 'active' : ''}`}
      id="dailyComments"
      aria-label="Comments"
      aria-hidden={!active}
    >
      <div className="daily-comments-shell">
        <header className="daily-comments-header">
          <h2 className="daily-comments-title">Comments</h2>
          <div className="daily-comments-header-actions">
            <span className="daily-comments-count">{COMMENT_ITEMS.length}</span>
            <button
              type="button"
              className="daily-comments-close"
              onClick={() => onClose?.()}
              aria-label="Close comments"
            >
              <i className="material-icons" aria-hidden="true">close</i>
            </button>
          </div>
        </header>

        <div className="daily-comments-scroll">
          {loading ? renderLoading() : (
          <ul className="retro-comments-list" role="list" aria-label="Retro comments list">
            {COMMENT_ITEMS.map((comment, index) => (
              <li key={comment.id} className={`retro-comment-item ${index % 2 === 1 ? 'is-even' : ''}`} role="listitem">
                <div className="retro-comment-infos">
                  <img src={comment.avatar} alt={`${comment.name} avatar`} className="retro-comment-avatar" />

                  {SOCIAL_LINKS.map((social) => (
                    <a
                      key={`${comment.id}-${social.id}`}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`retro-social retro-social-${social.id}`}
                      aria-label={social.label}
                    >
                      <i className={social.iconClass} aria-hidden="true" />
                      <span>{social.label}</span>
                    </a>
                  ))}
                </div>

                <div className="retro-comment-content">
                  <h3>
                    {comment.name}
                    <b>{comment.role}</b>
                  </h3>

                  <p>
                    {comment.body}{' '}
                    <a href={comment.linkHref} target="_blank" rel="noreferrer">
                      {comment.linkLabel}
                    </a>
                  </p>
                </div>
              </li>
            ))}
          </ul>
          )}
        </div>
      </div>
    </section>
  )
})

export default DailyComments
