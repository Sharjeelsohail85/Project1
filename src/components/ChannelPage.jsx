import { memo } from 'react'

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

const ChannelPage = memo(function ChannelPage({ active, onOpenVideo }) {
  return (
    <section
      id="browserContentChannel"
      className={`browser-content-page channel-page-shell ${active ? '' : 'hidden'}`}
      role="tabpanel"
      aria-labelledby="browserNavChannel"
    >
      <article className="channel-page">
        <header className="channel-hero">
          <div className="channel-avatar" aria-hidden="true">
            <i className="material-icons">podcasts</i>
          </div>

          <div className="channel-hero-copy">
            <p className="channel-kicker">Featured Channel</p>
            <h2 className="channel-title">Signal / Noise Lab</h2>
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
    </section>
  )
})

export default ChannelPage
