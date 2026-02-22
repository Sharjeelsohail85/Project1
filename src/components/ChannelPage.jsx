import { memo } from 'react'
import PosterText from './PosterText'

const noop = () => {}

const SERIES = [
  { title: 'Midnight Edits', meta: '12 episodes • Visual Essays' },
  { title: 'Signal Breakdowns', meta: '9 episodes • Sound Lab' },
  { title: 'Archive Dives', meta: '27 episodes • Culture Analysis' },
]

const DROPS = [
  { title: 'How Texture Changes Pacing', length: '18:42', tag: 'Essay' },
  { title: 'Sampling Rain Into a Lead Synth', length: '11:09', tag: 'Breakdown' },
  { title: 'The Aesthetic That Never Died', length: '22:03', tag: 'Culture' },
]

const ChannelPage = memo(function ChannelPage({
  active = true,
  embedded = false,
  onOpenVideo = noop,
  posterText = 'THENEEDLEDROP',
  posterTextEnabled = false,
}) {
  const content = (
    <article className="channel-page">
        <header className="channel-hero">
          <div className="channel-avatar" aria-hidden="true">
            <i className="material-icons">podcasts</i>
          </div>

          <div className="channel-hero-copy">
            <p className="channel-kicker">Featured Channel</p>
            {posterTextEnabled ? (
              <PosterText text={posterText} className="channel-title channel-title-poster" ariaLabel="Channel poster title" />
            ) : (
              <h2 className="channel-title">Signal / Noise Lab</h2>
            )}
            <p className="channel-tagline">
              Creative essays, sonic experiments, and internet-culture deep dives curated with your current site theme.
            </p>
            <div className="channel-stats" role="list" aria-label="Channel stats">
              <span role="listitem"><strong>1.3M</strong> subscribers</span>
              <span role="listitem"><strong>312</strong> uploads</span>
              <span role="listitem"><strong>89h</strong> weekly watch time</span>
            </div>
          </div>

          <div className="channel-actions">
            <button type="button" className="channel-cta primary" onClick={onOpenVideo}>Play Featured</button>
            <button type="button" className="channel-cta">Subscribe</button>
          </div>
        </header>

        <div className="channel-grid">
          <section className="channel-card">
            <h3>Live Series</h3>
            <ul>
              {SERIES.map((item) => (
                <li key={item.title}><span>{item.title}</span><small>{item.meta}</small></li>
              ))}
            </ul>
          </section>

          <section className="channel-card">
            <h3>Recent Drops</h3>
            <ul>
              {DROPS.map((drop) => (
                <li key={drop.title}><span>{drop.title}</span><small>{drop.length} • {drop.tag}</small></li>
              ))}
            </ul>
          </section>
        </div>
      </article>
  )

  if (embedded) {
    return content
  }

  return (
    <section
      id="channelPage"
      className={`channel-page-shell ${active ? '' : 'hidden'}`}
      role="region"
      aria-label="Channel"
    >
      {content}
    </section>
  )
})

export default ChannelPage
