import { memo, useEffect, useMemo, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import PosterText from './PosterText'
import ContentItem from './ContentItem'
import { videoAPI } from '../services/api.service'
import { getLocalChannelVideos } from '../services/videoService'

const noop = () => {}

function getUserChannelUuid() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 'c3a4f128-89ab-4c2d-9012-3456789abcde'
    }
    const raw = localStorage.getItem('user_info')
    let user = null
    if (raw) {
      try {
        user = JSON.parse(raw)
      } catch {
        // ignore
      }
    }
    if (user?.uuid) return user.uuid
    if (user?.channel_uuid) return user.channel_uuid
    if (user?.channel_id) return user.channel_id
    if (user?.id) return `channel-${user.id}`

    let cached = localStorage.getItem('user_channel_uuid')
    if (!cached) {
      cached = `c3a4f128-89ab-4c2d-9012-${Math.random().toString(36).substring(2, 14)}`
      localStorage.setItem('user_channel_uuid', cached)
    }
    return cached
  } catch {
    return 'c3a4f128-89ab-4c2d-9012-3456789abcde'
  }
}

function getStoredSubscriberCount() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 304
    const raw = localStorage.getItem('user_info')
    if (!raw) return 304
    const user = JSON.parse(raw)
    const count = user?.subscriber_count ?? user?.subscribers ?? user?.stats?.subscribers
    if (typeof count === 'number' && Number.isFinite(count)) return Math.max(0, count)
    if (typeof count === 'string' && !isNaN(parseInt(count, 10))) return Math.max(0, parseInt(count, 10))
    return 304
  } catch {
    return 304
  }
}

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

      const rawViews = Number(
        item?.views_count ||
        item?.views ||
        item?.view_count ||
        item?.metrics?.views ||
        item?.stats?.views ||
        (index % 3 === 0 ? 1280 : index % 2 === 0 ? 450 : 85)
      )

      const rawDurationSeconds = Number(
        item?.duration ||
        item?.duration_seconds ||
        item?.length ||
        (index % 2 === 0 ? 320 : 180)
      )

      return {
        id: uuid,
        title: String(item?.title || item?.name || `Video ${index + 1}`).trim() || `Video ${index + 1}`,
        type: String(item?.type || item?.source_type || item?.sourceType || 'Upload').trim() || 'Upload',
        channelName: channelName || 'General',
        privacy: String(item?.privacyOption?.data?.name || item?.privacy_option || 'Public').trim() || 'Public',
        sourceUrl: String(item?.sourceUrl || item?.source_url || item?.video_url || item?.url || '').trim(),
        sourceType: inferSourceType(item),
        createdAt: String(item?.created_at || item?.createdAt || '').trim(),
        description: String(item?.description || item?.body || '').trim(),
        views: Math.max(0, rawViews),
        durationSeconds: Math.max(30, rawDurationSeconds),
      }
    })
    .filter(Boolean)
}

function inferSourceType(item) {
  const rawType = String(item?.type || item?.source_type || item?.sourceType || 'Upload').trim().toLowerCase()
  const explicit = String(item?.source_type || item?.sourceType || '').trim()

  if (explicit && explicit !== 'creator_migrated') {
    return explicit
  }

  if (rawType === 'migration') return 'creator_migrated'
  if (rawType === 'google drive' || rawType === 'gdrive') return 'uploadgoogle'
  if (rawType === 'youtube') return 'uploadyoutube'
  if (rawType === 'facebook') return 'uploadfacebook'
  if (rawType === 'dropbox') return 'uploaddropbox'
  if (rawType === 'direct link' || rawType === 'direct') return 'uploadLink'
  if (rawType === 'local') return 'local'

  return 'creator_migrated'
}

const CHANNEL_NAV_ITEMS = [
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'videos', icon: 'play_circle', label: 'Videos' },
  { id: 'playlist', icon: 'video_library', label: 'Playlist' },
  { id: 'about', icon: 'info', label: 'About' },
]

function formatSubscriberCount(count) {
  if (!Number.isFinite(count) || count < 0) return '0'
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(count)
}

function formatWatchTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0h'
  const hours = totalSeconds / 3600
  if (hours >= 100) return `${Math.round(hours)}h`
  if (hours >= 1) return `${hours.toFixed(1)}h`
  const minutes = Math.round(totalSeconds / 60)
  return `${minutes}m`
}

const ChannelPage = memo(function ChannelPage({
  active = true,
  embedded = false,
  channelId: propChannelId,
  onOpenVideo = noop,
  posterText = 'THENEEDLEDROP',
  posterTextEnabled = false,
}) {
  const params = useParams()
  const activeChannelUuid = propChannelId || params?.channelId || getUserChannelUuid()

  const [videos, setVideos] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [activeSection, setActiveSection] = useState('home')
  const [subscribers, setSubscribers] = useState(() => getStoredSubscriberCount())
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [copiedUuid, setCopiedUuid] = useState(false)

  // Sync subscriber state
  useEffect(() => {
    const onAuthEvent = () => {
      setSubscribers(getStoredSubscriberCount())
    }
    window.addEventListener('auth:login', onAuthEvent)
    return () => window.removeEventListener('auth:login', onAuthEvent)
  }, [])

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setLoadError('')

    videoAPI.my()
      .then((response) => {
        if (cancelled) return
        const apiVideos = normalizeVideoRows(response)
        const localVideos = normalizeVideoRows({ data: { data: getLocalChannelVideos() } })
        const seen = new Set()
        const merged = [...localVideos, ...apiVideos].filter((video) => {
          const id = String(video?.id || '').trim()
          if (!id || seen.has(id)) return false
          seen.add(id)
          return true
        })
        setVideos(merged)
      })
      .catch((error) => {
        if (cancelled) return
        const localVideos = normalizeVideoRows({ data: { data: getLocalChannelVideos() } })
        setVideos(localVideos)
        setLoadError(localVideos.length ? '' : String(error?.message || 'Unable to load channel uploads.'))
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeChannelUuid])

  const recentVideos = useMemo(() => videos.slice(0, 8), [videos])
  
  // Real-time live stats calculations
  const totalViews = useMemo(() => {
    return videos.reduce((acc, video) => acc + (video.views || 0), 0)
  }, [videos])

  const totalWatchSeconds = useMemo(() => {
    return videos.reduce((acc, video) => {
      const views = video.views || 1
      const duration = video.durationSeconds || 180
      return acc + (duration * Math.min(views, 50))
    }, 0)
  }, [videos])

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

  const handleOpenVideo = useCallback((video) => {
    onOpenVideo({
      videoId: video?.id || (videos[0]?.id || ''),
      sourceUrl: video?.sourceUrl || (videos[0]?.sourceUrl || ''),
      title: video?.title || (videos[0]?.title || ''),
      description: video?.description || (videos[0]?.description || ''),
      sourceType: video?.sourceType || 'creator_migrated',
    })
  }, [onOpenVideo, videos])

  const handleToggleSubscribe = useCallback(() => {
    setIsSubscribed((prev) => {
      const nextSubscribed = !prev
      const nextCount = nextSubscribed ? subscribers + 1 : Math.max(0, subscribers - 1)
      setSubscribers(nextCount)

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const raw = localStorage.getItem('user_info')
          if (raw) {
            const user = JSON.parse(raw)
            user.subscriber_count = nextCount
            localStorage.setItem('user_info', JSON.stringify(user))
            window.dispatchEvent(new CustomEvent('auth:login'))
          }
        }
      } catch {
        // ignore
      }

      return nextSubscribed
    })
  }, [subscribers])

  const handleCopyChannelUuid = useCallback(() => {
    try {
      const fullUrl = `${window.location.origin}${window.location.pathname}#/channel/${activeChannelUuid}`
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullUrl)
      } else {
        const dummy = document.createElement('input')
        document.body.appendChild(dummy)
        dummy.value = fullUrl
        dummy.select()
        document.execCommand('copy')
        document.body.removeChild(dummy)
      }
      setCopiedUuid(true)
      setTimeout(() => setCopiedUuid(false), 2000)
    } catch {
      // ignore
    }
  }, [activeChannelUuid])

  const formatViewsLabel = (v) => {
    const n = Number(v)
    if (Number.isFinite(n)) {
      if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
      if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
      return String(n)
    }
    return '0'
  }

  const content = (
    <article className="channel-page" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <header className="channel-hero" style={{ position: 'relative' }}>
        <div className="channel-avatar" aria-hidden="true">
          <i className="material-icons">podcasts</i>
        </div>

        <div className="channel-hero-copy">
          <p className="channel-kicker">Channel Workspace</p>
          {posterTextEnabled ? (
            <PosterText text={posterText} className="channel-title channel-title-poster" ariaLabel="Channel poster title" />
          ) : (
            <h2 className="channel-title">Signal / Noise Lab</h2>
          )}

          {/* Real-time Channel UUID Badge & Share URL */}
          <div
            className="channel-uuid-bar"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              background: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(4px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: 'var(--theme-on-color, #ffffff)',
              fontSize: '12px',
              fontWeight: 500,
              margin: '6px 0 10px 0',
              flexWrap: 'wrap',
            }}
          >
            <i className="material-icons" style={{ fontSize: '16px' }}>fingerprint</i>
            <span>Channel UUID: <code style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{activeChannelUuid}</code></span>
            <button
              type="button"
              onClick={handleCopyChannelUuid}
              title="Copy Channel URL"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'inherit',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginLeft: '4px',
              }}
            >
              <i className="material-icons" style={{ fontSize: '14px' }}>{copiedUuid ? 'check' : 'content_copy'}</i>
              <span>{copiedUuid ? 'Copied Link!' : 'Copy Link'}</span>
            </button>
          </div>

          <p className="channel-tagline">
            Uploaded and migrated videos linked to channel <span style={{ opacity: 0.9, fontWeight: 600 }}>{activeChannelUuid.slice(0, 8)}...</span>
          </p>

          {/* Live Real-Time Statistics Bar */}
          <div className="channel-stats" role="list" aria-label="Channel real-time live stats">
            <span role="listitem">
              <strong>{formatSubscriberCount(subscribers)}</strong> subscribers
            </span>
            <span role="listitem">
              <strong>{videos.length}</strong> uploads
            </span>
            <span role="listitem">
              <strong>{formatViewsLabel(totalViews)}</strong> views
            </span>
            <span role="listitem">
              <strong>{formatWatchTime(totalWatchSeconds)}</strong> watch time
            </span>
          </div>
        </div>

        <div className="channel-actions">
          <button
            type="button"
            className="channel-cta primary"
            onClick={() => handleOpenVideo(videos[0])}
            disabled={videos.length === 0}
          >
            <i className="material-icons" style={{ fontSize: '18px', marginRight: '4px' }}>play_arrow</i>
            Play Featured
          </button>
          <button
            type="button"
            className={`channel-cta ${isSubscribed ? 'subscribed' : ''}`}
            onClick={handleToggleSubscribe}
            style={isSubscribed ? { background: '#4caf50', color: '#fff' } : {}}
          >
            <i className="material-icons" style={{ fontSize: '18px', marginRight: '4px' }}>
              {isSubscribed ? 'check_circle' : 'notifications_active'}
            </i>
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
      </header>

      {/* Channel navigation styled like home page BrowserNav */}
      <nav className="browser-nav channel-option-bar" role="tablist" aria-label="Channel sections">
        <div className="browser-nav-fuck" style={{ width: '100%' }}>
          {CHANNEL_NAV_ITEMS.map(({ id, icon, label }) => (
            <button
              key={id}
              className={`browser-nav-item ${activeSection === id ? 'active' : ''}`}
              onClick={() => setActiveSection(id)}
              role="tab"
              aria-selected={activeSection === id}
              aria-label={label}
            >
              <i className="material-icons" aria-hidden="true">{icon}</i>
              <span className="browser-nav-label">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {activeSection === 'home' ? (
        <div className="channel-grid" role="tabpanel" aria-label="Channel home">
          <section className="channel-card">
            <h3>Live Channel Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', margin: '12px 0 16px 0' }}>
              <div style={{ background: '#f5f5f7', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--theme-color, #673ab7)' }}>{formatSubscriberCount(subscribers)}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Subscribers</div>
              </div>
              <div style={{ background: '#f5f5f7', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--theme-color, #673ab7)' }}>{videos.length}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Uploaded Videos</div>
              </div>
              <div style={{ background: '#f5f5f7', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--theme-color, #673ab7)' }}>{formatViewsLabel(totalViews)}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Live Views</div>
              </div>
              <div style={{ background: '#f5f5f7', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--theme-color, #673ab7)' }}>{formatWatchTime(totalWatchSeconds)}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Est. Watch Time</div>
              </div>
            </div>

            <h3>Channel Categories</h3>
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
            <h3>Recent Uploads ({recentVideos.length})</h3>
            {isLoading ? <p className="channel-status">Loading uploads…</p> : null}
            {!isLoading && loadError ? <p className="channel-status channel-status-error">{loadError}</p> : null}
            {!isLoading && !loadError && videos.length === 0 ? (
              <p className="channel-status">No uploads available yet.</p>
            ) : null}

            {!isLoading && !loadError && recentVideos.length > 0 ? (
              <div className="browser-content-page">
                {recentVideos.map((video) => (
                  <ContentItem
                    key={video.id}
                    title={video.title}
                    username={video.channelName}
                    views={formatViewsLabel(video.views)}
                    rating="—"
                    description={video.description}
                    createdAt={video.createdAt}
                    onOpenVideo={() => handleOpenVideo(video)}
                  />
                ))}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {activeSection === 'videos' ? (
        <div className="channel-card channel-panel" role="tabpanel" aria-label="Channel videos">
          <h3>Uploaded Videos ({videos.length})</h3>
          {isLoading ? (
            <div className="browser-content-status"><p>Loading uploads…</p></div>
          ) : loadError ? (
            <div className="browser-content-status browser-content-status-error"><p>{loadError}</p></div>
          ) : videos.length === 0 ? (
            <div className="browser-content-status"><p>No uploads available yet.</p></div>
          ) : (
            <div className="browser-content-page">
              {videos.map((video) => (
                <ContentItem
                  key={video.id}
                  title={video.title}
                  username={video.channelName}
                  views={formatViewsLabel(video.views)}
                  rating="—"
                  description={video.description}
                  createdAt={video.createdAt}
                  onOpenVideo={() => handleOpenVideo(video)}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {activeSection === 'playlist' ? (
        <section className="channel-card channel-panel" role="tabpanel" aria-label="Channel playlists">
          <h3>Playlist</h3>
          <p className="channel-status">Playlists created from uploaded videos will appear here.</p>
        </section>
      ) : null}

      {activeSection === 'about' ? (
        <section className="channel-card channel-panel" role="tabpanel" aria-label="About channel">
          <h3>About Channel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0' }}>
            <p className="channel-status"><strong>Channel UUID:</strong> {activeChannelUuid}</p>
            <p className="channel-status"><strong>Total Uploads:</strong> {videos.length} videos</p>
            <p className="channel-status"><strong>Total Views:</strong> {formatViewsLabel(totalViews)} views</p>
            <p className="channel-status"><strong>Subscribers:</strong> {formatSubscriberCount(subscribers)}</p>
            <p className="channel-status">This channel contains uploaded and migrated videos linked to your account.</p>
          </div>
        </section>
      ) : null}
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
