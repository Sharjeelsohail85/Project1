import { memo, useRef, useState, useEffect, useCallback } from 'react'
import ContentItem from './ContentItem'
import { getLocalChannelVideos } from '../services/videoService'
import { videoAPI } from '../services/api.service'
import useSmoothWheelScroll from '../hooks/useSmoothWheelScroll'

// Sample content items data
const SAMPLE_ITEMS = Array(20).fill(null).map((_, index) => ({
  id: index,
  title: 'Another Long Title for an Item that is Different',
  username: 'Username2',
  views: '3.2k',
  rating: '7.5/10',
  description: 'A different description that is not the same description as the lorem ipsum description used in the video of the day example above, and that is also a very long and completely uninspired long description of length.',
  isPick: index === 8,
  isNsfw: index === 9 || index === 10,
  href: 'https://ddg.gg'
}))

const Browser = memo(function Browser({ activePage, onOpenVideo }) {
  const browserContentRef = useRef(null)
  const [videos, setVideos] = useState([])
  const [videosLoading, setVideosLoading] = useState(false)
  const [videosError, setVideosError] = useState('')

  useSmoothWheelScroll(browserContentRef, {
    // Disable custom wheel interception to rely on native scrolling behavior.
    enabled: false,
    damping: 0.1,
    wheelMultiplier: 1.15,
    maxDelta: 220,
    usePageFallback: false,
  })

  useEffect(() => {
    let cancelled = false

    setVideosLoading(true)
    setVideosError('')

    videoAPI.my()
      .then((response) => {
        if (cancelled) return
        const payload = response?.data || response || {}
        const rows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : []
            const apiVideos = rows.map((item) => {
              const uuid = String(item?.uuid || item?.id || '').trim()
              return {
                id: uuid,
                title: String(item?.title || item?.name || 'Untitled').trim(),
                username: String(item?.channel_name || item?.channel?.name || 'My Channel').trim(),
                views: '—',
                rating: '—',
                description: String(item?.description || '').trim(),
                isPick: false,
                isNsfw: false,
                href: '',
                videoId: uuid,
                sourceUrl: String(item?.sourceUrl || item?.source_url || item?.video_url || item?.url || '').trim(),
                sourceType: String(item?.source_type || item?.sourceType || 'creator_migrated').trim(),
              }
            }).filter((v) => v.id)

        const localRows = getLocalChannelVideos()
            const localVideos = (Array.isArray(localRows) ? localRows : []).map((item) => {
              const uuid = String(item?.uuid || item?.id || '').trim()
              return {
                id: uuid,
                title: String(item?.title || item?.name || 'Untitled').trim(),
                username: String(item?.channel_name || item?.channel?.name || 'My Channel').trim(),
                views: '—',
                rating: '—',
                description: String(item?.description || '').trim(),
                isPick: false,
                isNsfw: false,
                href: '',
                videoId: uuid,
                sourceUrl: String(item?.sourceUrl || item?.source_url || item?.video_url || item?.url || '').trim(),
                sourceType: String(item?.source_type || item?.sourceType || 'creator_migrated').trim(),
                createdAt: String(item?.created_at || '').trim(),
              }
            }).filter((v) => v.id)

        const seen = new Set()
        const merged = [...localVideos, ...apiVideos].filter((video) => {
          const vid = String(video?.id || '').trim()
          if (!vid || seen.has(vid)) return false
          seen.add(vid)
          return true
        })
        setVideos(merged)
      })
      .catch((error) => {
        if (cancelled) return
        const localRows = getLocalChannelVideos()
        const localVideos = (Array.isArray(localRows) ? localRows : []).map((item) => {
          const uuid = String(item?.uuid || item?.id || '').trim()
          return {
            id: uuid,
            title: String(item?.title || item?.name || 'Untitled').trim(),
            username: String(item?.channel_name || item?.channel?.name || 'My Channel').trim(),
            views: '—',
            rating: '—',
            description: String(item?.description || '').trim(),
            isPick: false,
            isNsfw: false,
            href: '',
            videoId: uuid,
            sourceUrl: String(item?.sourceUrl || item?.source_url || item?.video_url || item?.url || '').trim(),
            sourceType: 'creator_migrated',
          }
        }).filter((v) => v.id)
        setVideos(localVideos)
        setVideosError(localVideos.length ? '' : String(error?.message || 'Unable to load videos.'))
      })
      .finally(() => {
        if (cancelled) return
        setVideosLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleOpenVideo = useCallback((video) => {
    onOpenVideo?.({
      videoId: video.videoId,
      sourceUrl: video.sourceUrl,
      title: video.title,
      description: video.description,
      sourceType: video.sourceType || 'creator_migrated',
    })
  }, [onOpenVideo])

  return (
    <div id="browser" className="browser">
      <div id="browserContent" className="browser-content" ref={browserContentRef}>
        {/* Editors' Picks */}
        <div
          id="browserContentPicks"
          className={`browser-content-page ${activePage === 'browserContentPicks' ? '' : 'hidden'}`}
          role="tabpanel"
          aria-labelledby="browserNavPicks"
        >
          {SAMPLE_ITEMS.map((item) => (
            <ContentItem key={item.id} {...item} onOpenVideo={onOpenVideo} />
          ))}
        </div>

        {/* Videos */}
        <div
          id="browserContentVideos"
          className={`browser-content-page ${activePage === 'browserContentVideos' ? '' : 'hidden'}`}
          role="tabpanel"
          aria-labelledby="browserNavVideos"
        >
          {videosLoading ? (
            <div className="browser-content-status">
              <p>Loading videos…</p>
            </div>
          ) : videosError ? (
            <div className="browser-content-status browser-content-status-error">
              <p>{videosError}</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="browser-content-status">
              <p>No uploaded videos yet. Upload or migrate a video to see it here.</p>
            </div>
          ) : (
            videos.map((item) => (
<ContentItem
  key={item.id}
  title={item.title}
  username={item.username}
  views={item.views}
  rating={item.rating}
  description={item.description}
  createdAt={item.createdAt}
  onOpenVideo={() => handleOpenVideo(item)}
/>
            ))
          )}
        </div>

        {/* Popular */}
        <div
          id="browserContentPop"
          className={`browser-content-page ${activePage === 'browserContentPop' ? '' : 'hidden'}`}
          role="tabpanel"
          aria-labelledby="browserNavPop"
        >
          {/* Content would go here */}
        </div>

        {/* Subscriptions */}
        <div
          id="browserContentSubs"
          className={`browser-content-page ${activePage === 'browserContentSubs' ? '' : 'hidden'}`}
          role="tabpanel"
          aria-labelledby="browserNavSubs"
        >
          {/* Content would go here */}
        </div>

        {/* Recommended */}
        <div
          id="browserContentRec"
          className={`browser-content-page ${activePage === 'browserContentRec' ? '' : 'hidden'}`}
          role="tabpanel"
          aria-labelledby="browserNavRec"
        >
          {/* Content would go here */}
        </div>

        {/* Random */}
        <div
          id="browserContentRand"
          className={`browser-content-page ${activePage === 'browserContentRand' ? '' : 'hidden'}`}
          role="tabpanel"
          aria-labelledby="browserNavRand"
        >
          {/* Content would go here */}
        </div>
      </div>
    </div>
  )
})

export default Browser