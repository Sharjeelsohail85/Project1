import { memo, useEffect, useMemo, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import ContentItem from './ContentItem'
import ChannelCover from './ChannelCover'
import GlitchAvatar from './GlitchAvatar'
import { videoAPI } from '../services/api.service'
import { getLocalChannelVideos } from '../services/videoService'

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
  title: String(item?.title || item?.name || `Video ${index + 1}`).trim() || `Video ${index + 1}`,
  type: String(item?.type || item?.source_type || item?.sourceType || 'Upload').trim() || 'Upload',
  channelName: channelName || 'General',
  privacy: String(item?.privacyOption?.data?.name || item?.privacy_option || 'Public').trim() || 'Public',
  sourceUrl: String(item?.sourceUrl || item?.source_url || item?.video_url || item?.url || '').trim(),
  sourceType: inferSourceType(item),
  createdAt: String(item?.created_at || '').trim(),
  description: String(item?.description || item?.body || '').trim(),
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

const ChannelPage = memo(function ChannelPage({
  active = true,
  embedded = false,
  onOpenVideo = noop,
}) {
  const { id: routeId } = useParams()

  const loggedInUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user_info')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  const currentUserId = loggedInUser?.uuid || loggedInUser?.id || 'guest-user'
  const channelId = routeId || currentUserId

  const [videos, setVideos] = useState([])
  const [channelName, setChannelName] = useState('Signal / Noise Lab')
  const [subscriberCount, setSubscriberCount] = useState(0)
  const [watchTime, setWatchTime] = useState('0h')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [activeSection, setActiveSection] = useState('home')

  const loadChannelStats = useCallback(() => {
    try {
      const stored = localStorage.getItem(`channel_stats_${channelId}`)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      // ignore
    }

    const isCurrentUser = channelId === currentUserId
    const defaultSub = isCurrentUser && loggedInUser && loggedInUser.subscriber_count !== undefined
      ? Number(loggedInUser.subscriber_count)
      : 0
    const defaultWatchTime = isCurrentUser && loggedInUser && loggedInUser.watch_time !== undefined
      ? Number(loggedInUser.watch_time)
      : 0

    const initialStats = {
      subscriber_count: defaultSub,
      watch_time: defaultWatchTime,
      channel_name: isCurrentUser && loggedInUser
        ? (loggedInUser.channel_name || `${loggedInUser.first_name || ''} ${loggedInUser.last_name || ''}`.trim() || 'My Channel')
        : 'Channel',
      custom_url: isCurrentUser && loggedInUser
        ? (loggedInUser.custom_url || `@${loggedInUser.email ? loggedInUser.email.split('@')[0] : 'user'}`)
        : `@channel_${channelId.slice(-4)}`,
      is_subscribed: false
    }

    try {
      localStorage.setItem(`channel_stats_${channelId}`, JSON.stringify(initialStats))
    } catch (e) {
      // ignore
    }

    return initialStats
  }, [channelId, currentUserId, loggedInUser])

  useEffect(() => {
    const stats = loadChannelStats()
    if (stats) {
      setSubscriberCount(stats.subscriber_count)
      setWatchTime(`${stats.watch_time || 0}h`)
      setIsSubscribed(!!stats.is_subscribed)
      
      if (stats.channel_name) {
        setChannelName(stats.channel_name)
      }
    }
  }, [channelId, loadChannelStats])

  const formattedSubscribers = useMemo(() => {
    const n = Number(subscriberCount)
    if (!Number.isFinite(n) || n < 0) return '0'
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
    return String(n)
  }, [subscriberCount])

  const handleToggleSubscribe = useCallback(() => {
    try {
      const stats = loadChannelStats()
      if (!stats) return

      const nextSubscribed = !stats.is_subscribed
      const nextCount = nextSubscribed
        ? stats.subscriber_count + 1
        : Math.max(0, stats.subscriber_count - 1)

      const updatedStats = {
        ...stats,
        is_subscribed: nextSubscribed,
        subscriber_count: nextCount
      }

      localStorage.setItem(`channel_stats_${channelId}`, JSON.stringify(updatedStats))
      setSubscriberCount(nextCount)
      setIsSubscribed(nextSubscribed)

      if (channelId === currentUserId && loggedInUser) {
        const updatedUser = {
          ...loggedInUser,
          subscriber_count: nextCount
        }
        localStorage.setItem('user_info', JSON.stringify(updatedUser))
        window.dispatchEvent(new CustomEvent('auth:login'))
      }
    } catch (e) {
      // ignore
    }
  }, [channelId, currentUserId, loggedInUser, loadChannelStats])

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

const handleOpenVideo = useCallback((video) => {
  onOpenVideo({
    videoId: video.id,
    sourceUrl: video.sourceUrl,
    title: video.title,
    description: video.description,
    sourceType: video.sourceType || 'creator_migrated',
  })
}, [onOpenVideo])

  const formatViews = (v) => {
    const n = Number(v)
    if (Number.isFinite(n)) {
      if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
      if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
      return String(n)
    }
    return '—'
  }

  const content = (
    <article className="channel-page">
      <ChannelCover />
      <header className="channel-hero">
        <GlitchAvatar />

        <div className="channel-hero-copy">
          <p className="channel-kicker">Featured Channel</p>
          <h2 className="channel-title">{channelName}</h2>
          <p className="channel-tagline">
            Uploaded and migrated videos linked to your account channels appear here.
          </p>
          <div className="channel-stats" role="list" aria-label="Channel stats">
            <span role="listitem"><strong>{formattedSubscribers}</strong> subscribers</span>
            <span role="listitem"><strong>{videos.length}</strong> uploads</span>
            <span role="listitem"><strong>{watchTime}</strong> weekly watch time</span>
          </div>
        </div>

        <div className="channel-actions">
          <button type="button" className="channel-cta primary" onClick={onOpenVideo}>Play Featured</button>
          <button
            type="button"
            className={`channel-cta ${isSubscribed ? 'subscribed' : 'primary'}`}
            style={isSubscribed ? { background: '#eaeaea', color: '#666', border: '1px solid #ccc' } : {}}
            onClick={handleToggleSubscribe}
          >
            {isSubscribed ? '✓ Subscribed' : 'Subscribe'}
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
            <h3>Videos</h3>
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
  views={formatViews(video.views)}
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
          <h3>Uploaded Videos</h3>
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
  views={formatViews(video.views)}
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
          <h3>About</h3>
          <p className="channel-status">This channel contains uploaded and migrated videos linked to your account.</p>
          <p className="channel-status">Total uploads: {videos.length}</p>
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