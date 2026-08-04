import { memo, useEffect, useMemo, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import ContentItem from './ContentItem'
import ChannelCover from './ChannelCover'
import GlitchAvatar from './GlitchAvatar'
import { videoAPI } from '../services/api.service'
import { getLocalChannelVideos } from '../services/videoService'
import SeedCatalogue from './SeedCatalogue'
import FlowerSticker from './FlowerSticker'

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
  const { channelId } = useParams()
  const [videos, setVideos] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [activeSection, setActiveSection] = useState('home')
  const [copied, setCopied] = useState(false)
  const [selectedFlower, setSelectedFlower] = useState(() => {
    return localStorage.getItem('channel_seed_flower') || 'sunflower'
  })

  const resolvedChannelId = useMemo(() => {
    if (channelId) return channelId
    try {
      const rawUser = localStorage.getItem('user_info')
      if (rawUser) {
        const user = JSON.parse(rawUser)
        const uid = user?.channel_id || user?.channel?.id || user?.channel?.uuid || user?.uuid || user?.id
        if (uid) return String(uid).trim()
      }
    } catch {
      // ignore
    }
    return 'me'
  }, [channelId])

  const channelUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://project1-video-app.sharjeelsohail85.workers.dev'
    return `${origin}/channel/${resolvedChannelId}`
  }, [resolvedChannelId])

  const handleCopyLink = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(channelUrl)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(() => {
          try {
            const el = document.createElement('textarea')
            el.value = channelUrl
            document.body.appendChild(el)
            el.select()
            document.execCommand('copy')
            document.body.removeChild(el)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch {
            // ignore
          }
        })
    } else {
      try {
        const el = document.createElement('textarea')
        el.value = channelUrl
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // ignore
      }
    }
  }, [channelUrl])

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
          <h2 className="channel-title">Signal / Noise Lab</h2>
          <p className="channel-tagline">
            Uploaded and migrated videos linked to your account channels appear here.
          </p>
          <div className="channel-stats" role="list" aria-label="Channel stats" style={{ marginBottom: '10px' }}>
            <span role="listitem"><strong>1.3M</strong> subscribers</span>
            <span role="listitem"><strong>{videos.length}</strong> uploads</span>
            <span role="listitem"><strong>89h</strong> weekly watch time</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '6px 12px',
            borderRadius: '6px',
            width: 'max-content',
            maxWidth: '100%',
            color: '#9ca3af',
            fontFamily: 'monospace',
            marginTop: '8px',
          }}>
            <i className="material-icons" style={{ fontSize: '15px', color: 'var(--primary, #e5a93b)' }}>podcasts</i>
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              maxWidth: '320px'
            }} title={channelUrl}>
              {channelUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '500',
                marginLeft: '8px',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="channel-actions" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <FlowerSticker 
            selectedFlower={selectedFlower} 
            size={48} 
            onClick={() => {
              setActiveSection('about')
              setTimeout(() => {
                const targetElement = document.getElementById('botanical-milestone-card')
                if (targetElement) {
                  targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              }, 120)
            }}
          />
          <button type="button" className="channel-cta primary" onClick={onOpenVideo}>Play Featured</button>
          <button type="button" className="channel-cta">Subscribe</button>
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
          
          <div style={{
            marginTop: '12px',
            marginBottom: '16px',
            padding: '12px',
            background: 'var(--bg-card-nested, rgba(255, 255, 255, 0.02))',
            borderRadius: '6px',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
            maxWidth: '100%',
            overflow: 'hidden'
          }}>
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Unique Channel Link</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted, #9ca3af)', wordBreak: 'break-all' }}>
                {channelUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  background: 'var(--primary, #e5a93b)',
                  border: 'none',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500',
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div id="botanical-milestone-card" style={{ marginTop: '20px', borderTop: '1px solid var(--border, #e5e7eb)', paddingTop: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main, #111827)' }}>
              Channel Botanical Milestone Card
            </h4>
            <p className="channel-status" style={{ marginBottom: '16px' }}>
              Your channel's growth and milestones captured as a custom botanical seed packet from our classic collection.
            </p>
            <SeedCatalogue
              videoCount={videos.length}
              selectedFlower={selectedFlower}
              onSelectFlower={(flowerId) => {
                setSelectedFlower(flowerId);
                localStorage.setItem('channel_seed_flower', flowerId);
              }}
            />
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