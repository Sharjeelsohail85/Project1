import { memo, useEffect, useMemo, useState, useCallback } from 'react'
import PosterText from './PosterText'
import ContentItem from './ContentItem'
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
      if (!uuid) return null

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
        createdAt: String(item?.created_at || item?.createdAt || '').trim(),
        description: String(item?.description || item?.body || '').trim(),
        views: item?.views_count || item?.views || item?.view_count || '1.2K',
      }
    })
    .filter(Boolean)
}

function inferSourceType(item) {
  const rawType = String(item?.type || item?.source_type || item?.sourceType || 'Upload').trim().toLowerCase()
  const explicit = String(item?.source_type || item?.sourceType || '').trim()

  if (explicit && explicit !== 'creator_migrated') return explicit
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

const COVER_PRESETS = [
  { id: 'city', name: 'Night City', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80' },
  { id: 'cyber', name: 'Cyber Neon', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=80' },
  { id: 'sunset', name: 'Sunset Horizon', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80' },
  { id: 'space', name: 'Deep Space', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80' },
]

const FLOWER_COLORS = [
  { id: 'pink', color: '#ff4081', gradient: 'radial-gradient(circle, #ff4081 0%, #7c4dff 100%)' },
  { id: 'gold', color: '#ffd700', gradient: 'radial-gradient(circle, #ffd700 0%, #ff8c00 100%)' },
  { id: 'emerald', color: '#00e676', gradient: 'radial-gradient(circle, #00e676 0%, #00b0ff 100%)' },
  { id: 'purple', color: '#e040fb', gradient: 'radial-gradient(circle, #e040fb 0%, #00e5ff 100%)' },
]

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
  const [activeSection, setActiveSection] = useState('home')

  // Cover Page Banner Editor State
  const [coverUrl, setCoverUrl] = useState(() => {
    return localStorage.getItem('channel_cover_url') || COVER_PRESETS[0].url
  })
  const [coverHeight, setCoverHeight] = useState(() => {
    return Number(localStorage.getItem('channel_cover_height')) || 280
  })
  const [coverOverlay, setCoverOverlay] = useState(() => {
    return Number(localStorage.getItem('channel_cover_overlay')) || 0.45
  })
  const [showCoverModal, setShowCoverModal] = useState(false)

  // Glitch Avatar Profile Pic Editor State
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem('channel_avatar_url') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  })
  const [glitchEnabled, setGlitchEnabled] = useState(() => {
    return localStorage.getItem('channel_glitch_enabled') !== 'false'
  })
  const [glitchIntensity, setGlitchIntensity] = useState(() => {
    return Number(localStorage.getItem('channel_glitch_intensity')) || 5
  })
  const [showAvatarModal, setShowAvatarModal] = useState(false)

  // Flower Emblem State
  const [flowerColorIndex, setFlowerColorIndex] = useState(() => {
    return Number(localStorage.getItem('channel_flower_color_index')) || 0
  })

  // Load videos
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

    return () => { cancelled = true }
  }, [])

  // Persist cover page changes
  const saveCoverSettings = (newUrl, newHeight, newOverlay) => {
    setCoverUrl(newUrl)
    setCoverHeight(newHeight)
    setCoverOverlay(newOverlay)
    localStorage.setItem('channel_cover_url', newUrl)
    localStorage.setItem('channel_cover_height', String(newHeight))
    localStorage.setItem('channel_cover_overlay', String(newOverlay))
  }

  // Persist avatar glitch changes
  const saveAvatarSettings = (newAvatar, newGlitch, newIntensity) => {
    setAvatarUrl(newAvatar)
    setGlitchEnabled(newGlitch)
    setGlitchIntensity(newIntensity)
    localStorage.setItem('channel_avatar_url', newAvatar)
    localStorage.setItem('channel_glitch_enabled', String(newGlitch))
    localStorage.setItem('channel_glitch_intensity', String(newIntensity))
  }

  // Toggle flower emblem color
  const cycleFlowerColor = () => {
    const nextIndex = (flowerColorIndex + 1) % FLOWER_COLORS.length
    setFlowerColorIndex(nextIndex)
    localStorage.setItem('channel_flower_color_index', String(nextIndex))
  }

  const recentVideos = useMemo(() => videos.slice(0, 8), [videos])

  const channelSummary = useMemo(() => {
    const counts = new Map()
    videos.forEach((video) => {
      const key = String(video?.channelName || 'General').trim() || 'General'
      counts.set(key, (counts.get(key) || 0) + 1)
    })

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
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

  const activeFlower = FLOWER_COLORS[flowerColorIndex] || FLOWER_COLORS[0]

  const content = (
    <article className="channel-page">
      {/* COVER PAGE BANNER / HERO SECTION */}
      <header
        className="channel-hero"
        style={{
          position: 'relative',
          minHeight: `${coverHeight}px`,
          backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, ${coverOverlay}) 0%, rgba(15, 23, 42, 0.88) 100%), url(${coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '16px',
          padding: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          color: '#ffffff',
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* GLITCH AVATAR PROFILE PIC */}
        <div
          className={`glitch-avatar-wrapper ${glitchEnabled ? 'glitch-active' : ''}`}
          onClick={() => setShowAvatarModal(true)}
          title="Click to edit profile avatar & glitch effect"
        >
          <div className="glitch-avatar-box">
            <img src={avatarUrl} alt="Channel Avatar" className="glitch-avatar-img" />
            <div className="glitch-edit-overlay">
              <i className="material-icons" style={{ fontSize: 20 }}>edit</i>
              <span>Glitch Edit</span>
            </div>
          </div>
        </div>

        {/* HERO COPY & FLOWER EMBLEM */}
        <div className="channel-hero-copy" style={{ flexGrow: 1 }}>
          <p className="channel-kicker" style={{ color: '#ff4081', fontWeight: 600, letterSpacing: '1px' }}>
            CHANNEL WORKSPACE
          </p>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {posterTextEnabled ? (
              <PosterText text={posterText} className="channel-title channel-title-poster" ariaLabel="Channel poster title" />
            ) : (
              <h2 className="channel-title" style={{ margin: 0, fontSize: '32px', fontWeight: 800 }}>
                Signal / Noise Lab
              </h2>
            )}

            {/* FLOWER EMBLEM ("flower thing") */}
            <span
              className="channel-flower-emblem"
              style={{ background: activeFlower.gradient, cursor: 'pointer' }}
              onClick={cycleFlowerColor}
              title="Click flower to change bloom style"
            >
              <i className="material-icons">local_florist</i>
            </span>
          </div>

          <p className="channel-tagline" style={{ opacity: 0.85, marginTop: '8px' }}>
            Uploaded & migrated videos linked to your account.
          </p>

          <div className="channel-stats" role="list" aria-label="Channel summary metrics" style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <span role="listitem"><strong>304</strong> subscribers</span>
            <span role="listitem"><strong>{videos.length}</strong> uploads</span>
          </div>
        </div>

        {/* CHANNEL & COVER EDIT ACTIONS */}
        <div className="channel-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="channel-cta primary"
            onClick={() => handleOpenVideo(videos[0])}
            disabled={videos.length === 0}
            style={{ padding: '10px 20px', borderRadius: '20px', fontWeight: 700 }}
          >
            Play Featured
          </button>

          <button
            type="button"
            className="channel-cta"
            onClick={() => setShowCoverModal(true)}
            style={{ padding: '8px 16px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff' }}
          >
            <i className="material-icons" style={{ fontSize: 16, marginRight: 4, verticalAlign: 'middle' }}>wallpaper</i>
            Edit Cover
          </button>
        </div>
      </header>

      {/* CHANNEL NAVIGATION */}
      <nav className="browser-nav channel-option-bar" role="tablist" aria-label="Channel sections" style={{ margin: '24px 0' }}>
        <div className="browser-nav-fuck">
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

      {/* CONTENT SECTIONS */}
      {activeSection === 'home' && (
        <div className="channel-grid" role="tabpanel" aria-label="Channel home">
          <section className="channel-card">
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
                    views={video.views}
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
      )}

      {activeSection === 'videos' && (
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
                  views={video.views}
                  rating="—"
                  description={video.description}
                  createdAt={video.createdAt}
                  onOpenVideo={() => handleOpenVideo(video)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'playlist' && (
        <section className="channel-card channel-panel" role="tabpanel" aria-label="Channel playlists">
          <h3>Playlist</h3>
          <p className="channel-status">Playlists created from uploaded videos will appear here.</p>
        </section>
      )}

      {activeSection === 'about' && (
        <section className="channel-card channel-panel" role="tabpanel" aria-label="About channel">
          <h3>About Channel</h3>
          <p className="channel-status">This channel contains uploaded and migrated videos linked to your account.</p>
        </section>
      )}

      {/* COVER PAGE EDITOR MODAL */}
      {showCoverModal && (
        <div className="cover-editor-modal" onClick={() => setShowCoverModal(false)}>
          <div className="cover-editor-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
              Channel Cover Page Banner Editor
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                Preset Cover Banners:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {COVER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => saveCoverSettings(preset.url, coverHeight, coverOverlay)}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: coverUrl === preset.url ? '2px solid #673ab7' : '1px solid #cbd5e1',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Custom Cover Image URL:
              </label>
              <input
                type="text"
                value={coverUrl}
                onChange={(e) => saveCoverSettings(e.target.value, coverHeight, coverOverlay)}
                placeholder="https://images.unsplash.com/..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Banner Height ({coverHeight}px):
              </label>
              <input
                type="range"
                min="200"
                max="400"
                value={coverHeight}
                onChange={(e) => saveCoverSettings(coverUrl, Number(e.target.value), coverOverlay)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowCoverModal(false)}
                style={{ padding: '8px 20px', borderRadius: '8px', background: '#673ab7', color: '#fff', border: 'none', fontWeight: 700 }}
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLITCH AVATAR EDITOR MODAL */}
      {showAvatarModal && (
        <div className="cover-editor-modal" onClick={() => setShowAvatarModal(false)}>
          <div className="cover-editor-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
              Glitch Avatar Profile Picture Editor
            </h3>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div
                className={`glitch-avatar-box ${glitchEnabled ? 'glitch-active' : ''}`}
                style={{ margin: '0 auto 12px', width: 110, height: 110 }}
              >
                <img src={avatarUrl} alt="Glitch Avatar Preview" className="glitch-avatar-img" />
              </div>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Live Glitch Effect Preview</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Avatar Image URL:
              </label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => saveAvatarSettings(e.target.value, glitchEnabled, glitchIntensity)}
                placeholder="https://..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Cyber Glitch Effect:</span>
              <button
                type="button"
                onClick={() => saveAvatarSettings(avatarUrl, !glitchEnabled, glitchIntensity)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: glitchEnabled ? '#ff4081' : '#cbd5e1',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {glitchEnabled ? 'GLITCH ON' : 'GLITCH OFF'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                style={{ padding: '8px 20px', borderRadius: '8px', background: '#673ab7', color: '#fff', border: 'none', fontWeight: 700 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )

  if (embedded) return content

  return (
    <section id="channelPage" className={`channel-page-shell ${active ? '' : 'hidden'}`} role="region" aria-label="Channel">
      {content}
    </section>
  )
})

export default ChannelPage
