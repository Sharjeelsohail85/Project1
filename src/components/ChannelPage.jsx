import { memo, useEffect, useMemo, useState } from 'react'
import PosterText from './PosterText'
import { videoAPI } from '../services/api.service'

const noop = () => {}

function normalizeVideoRows(response) {
  const payload = response?.data || response || {}
  const rows = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : []

  return rows
    .map((item, index) => {
      const uuid = String(item?.uuid || item?.id || '').trim()
      if (!uuid) {
        return null
      }

      const channelName = String(
        item?.channel?.data?.name
          || item?.channel?.name
          || item?.channel_name
          || 'General'
      ).trim()

      return {
        id: uuid,
        title: String(item?.name || `Video ${index + 1}`).trim() || `Video ${index + 1}`,
        type: String(item?.type || 'Upload').trim() || 'Upload',
        channelName: channelName || 'General',
        privacy: String(item?.privacyOption?.data?.name || item?.privacy_option || 'Public').trim() || 'Public',
      }
    })
    .filter(Boolean)
}

const ChannelPage = memo(function ChannelPage({
  active = true,
  embedded = false,
  onOpenVideo = noop,
  posterText = 'THENEEDLEDROP',
  posterTextEnabled = false,
}) {
  const [videos, setVideos] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setLoadError('')

    videoAPI.my()
      .then((response) => {
        if (cancelled) return
        setVideos(normalizeVideoRows(response))
      })
      .catch((error) => {
        if (cancelled) return
        setVideos([])
        setLoadError(String(error?.message || 'Unable to load channel uploads.'))
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const recentVideos = useMemo(() => videos.slice(0, 8), [videos])
  const channelSummary = useMemo(() => {
    const counts = new Map()
    videos.forEach((video) => {
      const key = String(video?.channelName || 'General').trim() || 'General'
      counts.set(key, (counts.get(key) || 0) + 1)
    })

    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [videos])

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
              Uploaded and migrated videos linked to your account channels appear here.
            </p>
            <div className="channel-stats" role="list" aria-label="Channel stats">
              <span role="listitem"><strong>1.3M</strong> subscribers</span>
              <span role="listitem"><strong>{videos.length}</strong> uploads</span>
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
            <h3>Channel Allocation</h3>
            {isLoading ? <p className="channel-status">Loading channels…</p> : null}
            {!isLoading && loadError ? <p className="channel-status channel-status-error">{loadError}</p> : null}
            {!isLoading && !loadError && channelSummary.length === 0 ? (
              <p className="channel-status">No channel uploads found yet.</p>
            ) : null}

            {!isLoading && !loadError && channelSummary.length > 0 ? (
              <ul>
                {channelSummary.map((item) => (
                  <li key={item.name}>
                    <span>{item.name}</span>
                    <small>{item.count} videos</small>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="channel-card">
            <h3>Recent Uploads</h3>
            {isLoading ? <p className="channel-status">Loading uploads…</p> : null}
            {!isLoading && loadError ? <p className="channel-status channel-status-error">{loadError}</p> : null}
            {!isLoading && !loadError && recentVideos.length === 0 ? (
              <p className="channel-status">No uploads available yet.</p>
            ) : null}

            {!isLoading && !loadError && recentVideos.length > 0 ? (
              <ul>
                {recentVideos.map((video) => (
                  <li key={video.id}>
                    <span>{video.title}</span>
                    <small>{video.channelName} • {video.privacy}</small>
                    <button
                      type="button"
                      className="channel-item-action"
                      onClick={() => onOpenVideo({ videoId: video.id })}
                    >
                      Play
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
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
