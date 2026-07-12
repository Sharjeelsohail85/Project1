import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Titlebar from './components/Titlebar'
import Slideout from './components/Slideout'
import Shadow from './components/Shadow'
import Content from './components/Content'
import SettingsPage from './components/SettingsPage'
import ChannelPage from './components/ChannelPage'
import PageFaq from './pages/PageFaq'
import OAuthCallback from './components/OAuthCallback'
import { DEFAULT_VIDEO_SOURCE } from './utils/videoSource'
import { getLocalChannelVideos } from './services/videoService'
import { isAuthenticated as checkAuth, logout } from './services/auth.service'
import './styles/global.css'
import './styles/design-system.css'

// Persistence keys (replaces Cookies from original)
const STORAGE_DAILY_VISIBLE = 'dailyVisible'
const STORAGE_CURRENT_PAGE = 'currentPage'
const STORAGE_PERSONALIZATION_EFFECTS = 'personalizationEffects'
const STORAGE_CHANNEL_POSTER_TEXT = 'channelPosterText'
const STORAGE_CHANNEL_POSTER_ENABLED = 'channelPosterEnabled'

const DEFAULT_PERSONALIZATION_EFFECTS = {
  infiniteGridExplorer: false,
  css2: false,
  mixingItUp: false,
}

const DEFAULT_CHANNEL_POSTER_TEXT = 'THENEEDLEDROP'

const PERSONALIZATION_EFFECT_CLASS_MAP = {
  infiniteGridExplorer: 'theme-effect-infinite-grid',
  css2: 'theme-effect-css2',
  mixingItUp: 'theme-effect-mixing',
}

const DEFAULT_AUTH_SUBSCRIBER_COUNT = 304

function canUseLocalStorage() {
  return typeof window !== 'undefined' && !!window.localStorage
}

function parseSubscriberCountValue(value) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.round(value)
  }

  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().replace(/,/g, '')
  if (!normalized) {
    return null
  }

  const compactMatch = normalized.match(/^(\d+(?:\.\d+)?)([kmb])$/i)
  if (compactMatch) {
    const numericPart = Number(compactMatch[1])
    const suffix = compactMatch[2].toLowerCase()
    if (!Number.isFinite(numericPart) || numericPart < 0) {
      return null
    }

    const multiplier = suffix === 'k'
      ? 1000
      : suffix === 'm'
        ? 1000000
        : 1000000000

    return Math.round(numericPart * multiplier)
  }

  const parsed = Number.parseInt(normalized, 10)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

function resolveSubscriberCountFromUserInfo(userInfo) {
  if (!userInfo || typeof userInfo !== 'object') {
    return null
  }

  const candidates = [
    userInfo.subscriber_count,
    userInfo.subscriberCount,
    userInfo.subscribers,
    userInfo.followers,
    userInfo.follower_count,
    userInfo.followers_count,
    userInfo.followersCount,
    userInfo.stats?.subscriber_count,
    userInfo.stats?.subscriberCount,
    userInfo.stats?.subscribers,
    userInfo.metrics?.subscriber_count,
    userInfo.metrics?.subscriberCount,
    userInfo.metrics?.subscribers,
    userInfo.metrics?.followers,
  ]

  for (const candidate of candidates) {
    const parsed = parseSubscriberCountValue(candidate)
    if (parsed !== null) {
      return parsed
    }
  }

  return null
}

function getStoredSubscriberCount() {
  try {
    if (!canUseLocalStorage()) {
      return null
    }

    const raw = localStorage.getItem('user_info')
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    return resolveSubscriberCountFromUserInfo(parsed)
  } catch {
    return null
  }
}

function formatSubscriberCountLabel(value) {
  if (!Number.isFinite(value) || value < 0) {
    return '0'
  }

  if (value >= 1000000) {
    const compact = value >= 10000000 ? (value / 1000000).toFixed(0) : (value / 1000000).toFixed(1)
    return `${compact.replace(/\.0$/, '')}M`
  }

  if (value >= 1000) {
    const compact = value >= 100000 ? (value / 1000).toFixed(0) : (value / 1000).toFixed(1)
    return `${compact.replace(/\.0$/, '')}K`
  }

  return String(value)
}

// Keep runtime-injected styles minimal.
// Responsive layout behavior is centralized in css/style.css.
const inlineStyles = `
  .browser-nav {
    height: auto;
  }
`

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const isSettingsRoute = location.pathname === '/settings' || location.pathname === '/theme-designer' || location.pathname === '/channel' || location.pathname === '/faq'
  
  // Check authentication status on mount
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return checkAuth()
    } catch {
      return false
    }
  })
  const [subscriberCount, setSubscriberCount] = useState(() => {
    let auth = false
    try {
      auth = checkAuth()
    } catch {
      auth = false
    }

    if (!auth) {
      return null
    }

    return getStoredSubscriberCount() ?? DEFAULT_AUTH_SUBSCRIBER_COUNT
  })
  const subscriberCountLabel = formatSubscriberCountLabel(subscriberCount ?? DEFAULT_AUTH_SUBSCRIBER_COUNT)
  
  // State management - initialize from localStorage when available (replaces Cookies.get from original)
  const [slideoutVisible, setSlideoutVisible] = useState(false)
  const [searchVisible, setSearchVisible] = useState(false)
  
  // On first load, if not authenticated, show promo overlay (main signup/login page)
  // If authenticated, show daily player based on preference
  const [dailyActive, setDailyActive] = useState(() => {
    // If not authenticated, don't show daily player on first load
    let auth = false
    try {
      auth = checkAuth()
    } catch {
      auth = false
    }

    if (!auth) {
      return false
    }
    
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_DAILY_VISIBLE)
        return stored !== 'false'
      }
    } catch {
      // localStorage unavailable (SSR, private mode, etc.)
    }
    return true
  })
  
  // Make the home route default to the promo/content page.
  const [promoActive, setPromoActive] = useState(true)
  const [signupActive, setSignupActive] = useState(false)
  
  const [loginActive, setLoginActive] = useState(false)
  const [uploadActive, setUploadActive] = useState(false)
  const [theaterMode, setTheaterMode] = useState(false)
  const [currentPromoSlide, setCurrentPromoSlide] = useState(0)
  const [signupStep, setSignupStep] = useState(1)
  const [uploadStep, setUploadStep] = useState(1)
  const [currentVideoSource, setCurrentVideoSource] = useState(() => ({ ...DEFAULT_VIDEO_SOURCE }))
  const [activeBrowserPage, setActiveBrowserPage] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(STORAGE_CURRENT_PAGE) || 'browserContentPicks'
      }
    } catch {
      // localStorage unavailable
    }
    return 'browserContentPicks'
  })
  const [themeColor, setThemeColor] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('themeColor') || '#673AB7'
      }
    } catch {
      // localStorage unavailable
    }
    return '#673AB7'
  })
  const [personalizationEffects, setPersonalizationEffects] = useState(() => {
    const fallback = { ...DEFAULT_PERSONALIZATION_EFFECTS }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_PERSONALIZATION_EFFECTS)
        if (!stored) {
          return fallback
        }

        const parsed = JSON.parse(stored)
        if (!parsed || typeof parsed !== 'object') {
          return fallback
        }

        return {
          ...fallback,
          ...Object.fromEntries(Object.keys(fallback).map((key) => [key, Boolean(parsed[key])])),
        }
      }
    } catch {
      // localStorage unavailable or invalid data
    }

    return fallback
  })
  const [channelPosterText, setChannelPosterText] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_CHANNEL_POSTER_TEXT)
        if (typeof stored === 'string' && stored.trim() !== '') {
          return stored.slice(0, 28)
        }
      }
    } catch {
      // ignore
    }

    return DEFAULT_CHANNEL_POSTER_TEXT
  })
  const [channelPosterEnabled, setChannelPosterEnabled] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(STORAGE_CHANNEL_POSTER_ENABLED) === 'true'
      }
    } catch {
      // ignore
    }

    return false
  })

  // Helper function to darken a hex color
  const darkenColor = useCallback((hex, percent) => {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.max(0, Math.floor((num >> 16) * (1 - percent)))
    const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent)))
    const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent)))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }, [])

  const getThemeContrast = useCallback((hex) => {
    const normalized = String(hex || '').trim()
    const raw = normalized.replace('#', '')
    const full = raw.length === 3
      ? raw.split('').map((c) => c + c).join('')
      : raw.padStart(6, '0').slice(0, 6)

    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.68
      ? {
          onColor: '#212121',
          onColorMuted: 'rgba(33, 33, 33, 0.72)',
          surfaceOverlay: 'rgba(0, 0, 0, 0.10)'
        }
      : {
          onColor: '#FAFAFA',
          onColorMuted: 'rgba(250, 250, 250, 0.78)',
          surfaceOverlay: 'rgba(255, 255, 255, 0.16)'
        }
  }, [])

  // Initialize theme color CSS variable on mount and when themeColor changes
  useEffect(() => {
    const contrast = getThemeContrast(themeColor)
    document.documentElement.style.setProperty('--theme-color', themeColor)
    document.documentElement.style.setProperty('--theme-color-dark', darkenColor(themeColor, 0.15))
    document.documentElement.style.setProperty('--theme-on-color', contrast.onColor)
    document.documentElement.style.setProperty('--theme-on-color-muted', contrast.onColorMuted)
    document.documentElement.style.setProperty('--theme-surface-overlay', contrast.surfaceOverlay)
  }, [themeColor, darkenColor, getThemeContrast])

  // Persist dailyVisible and currentPage (replaces Cookies.set from original)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_DAILY_VISIBLE, String(dailyActive))
      }
    } catch {
      // ignore
    }
  }, [dailyActive])
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_CURRENT_PAGE, activeBrowserPage)
      }
    } catch {
      // ignore
    }
  }, [activeBrowserPage])
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('themeColor', themeColor)
      }
    } catch {
      // ignore
    }
  }, [themeColor])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_PERSONALIZATION_EFFECTS, JSON.stringify(personalizationEffects))
      }
    } catch {
      // ignore
    }
  }, [personalizationEffects])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_CHANNEL_POSTER_TEXT, channelPosterText)
      }
    } catch {
      // ignore
    }
  }, [channelPosterText])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_CHANNEL_POSTER_ENABLED, String(channelPosterEnabled))
      }
    } catch {
      // ignore
    }
  }, [channelPosterEnabled])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    const html = document.documentElement
    const body = document.body
    if (!html || !body) {
      return undefined
    }

    const targets = [html, body]

    Object.entries(PERSONALIZATION_EFFECT_CLASS_MAP).forEach(([key, className]) => {
      const enabled = Boolean(personalizationEffects[key])
      targets.forEach((element) => {
        element.classList.toggle(className, enabled)
      })
    })

    return () => {
      Object.values(PERSONALIZATION_EFFECT_CLASS_MAP).forEach((className) => {
        targets.forEach((element) => {
          element.classList.remove(className)
        })
      })
    }
  }, [personalizationEffects])


  // Toggle slideout menu
  const toggleSlideout = useCallback(() => {
    setSlideoutVisible(prev => !prev)
  }, [])

  // Toggle search
  const toggleSearch = useCallback(() => {
    setSearchVisible(prev => !prev)
  }, [])

  // Toggle daily/video player
  const toggleDaily = useCallback(() => {
    setDailyActive((prev) => {
      const next = !prev
      if (!next) {
        setTheaterMode(false)
      }
      return next
    })
  }, [])

  // Show/hide promo overlay
  const showPromo = useCallback(() => {
    navigate('/')
    setPromoActive(true)
    setSignupActive(false)
    setLoginActive(false)
    setUploadActive(false)
    setDailyActive(false)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('promo_dismissed')
      }
    } catch {
      // ignore
    }
  }, [navigate])

  const hidePromo = useCallback(() => {
    setPromoActive(false)
    setSignupActive(false)
    setLoginActive(false)
    setUploadActive(false)
    setDailyActive(false)
    // Mark promo as dismissed
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('promo_dismissed', 'true')
      }
    } catch {
      // ignore
    }
  }, [])

  // Navigate promo slides
  const nextPromo = useCallback(() => {
    setCurrentPromoSlide(prev => (prev + 1) % 4)
  }, [])

  // Show/hide signup
  const showSignup = useCallback(() => {
    navigate('/')
    setPromoActive(false)
    setSignupActive(true)
    setSignupStep(1)
    setLoginActive(false)
    setUploadActive(false)
    setDailyActive(false)
  }, [navigate])

  const openPostPage = useCallback(() => {
    if (!isAuthenticated) {
      setPromoActive(false)
      setSignupActive(false)
      setLoginActive(true)
      setUploadActive(false)
      setDailyActive(false)
      navigate('/login')
      return
    }

    setPromoActive(false)
    setSignupActive(false)
    setLoginActive(false)
    setUploadActive(false)
    setDailyActive(false)
    setSignupStep(1)
    setUploadStep(1)
    navigate('/studio/migrate')
  }, [isAuthenticated, navigate])

  const hideSignup = useCallback(() => {
    setSignupActive(false)
    setDailyActive(false)
    setPromoActive(false)
  }, [])

  // Navigate signup steps
  const nextSignup = useCallback(() => {
    if (signupStep >= 4) {
      openPostPage()
      return
    }

    setSignupStep(prev => Math.min(prev + 1, 4))
  }, [openPostPage, signupStep])

  const prevSignup = useCallback(() => {
    setSignupStep(prev => Math.max(prev - 1, 1))
  }, [])

  // Show/hide login
  const showLogin = useCallback(() => {
    setPromoActive(false)
    setLoginActive(true)
    setSignupActive(false)
    setUploadActive(false)
    setDailyActive(false)
    navigate('/login')
  }, [navigate])

  // Handle main-page "Log In" button: either show login prompt or go straight to Post page
  const handleRequestLogin = useCallback(() => {
    if (isAuthenticated) {
      navigate('/post')
    } else {
      showLogin()
    }
  }, [isAuthenticated, navigate, showLogin])

  const hideLogin = useCallback(() => {
    setLoginActive(false)
    setDailyActive(false)
    setPromoActive(false)
  }, [])

  const handleUnauthorized = useCallback(() => {
    setIsAuthenticated(false)
    setSubscriberCount(null)
    setSignupActive(false)
    setUploadActive(false)
    setDailyActive(false)
    // Return user to the home promo/content page.
    setPromoActive(true)
    setLoginActive(false)
    navigate('/')
  }, [navigate])

  const handleSignOut = useCallback(() => {
    try {
      logout()
    } catch {
      // ignore and continue local sign-out transition
    }

    setSlideoutVisible(false)
    setIsAuthenticated(false)
    setSubscriberCount(null)
    setSignupActive(false)
    setUploadActive(false)
    setDailyActive(false)
    setPromoActive(true)
    setLoginActive(false)
    navigate('/')
  }, [navigate])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const onUnauthorized = () => {
      handleUnauthorized()
    }

    const onAuthLogin = () => {
      try {
        const auth = checkAuth()
        setIsAuthenticated(auth)
        setSubscriberCount(auth ? (getStoredSubscriberCount() ?? DEFAULT_AUTH_SUBSCRIBER_COUNT) : null)
      } catch {
        setIsAuthenticated(false)
        setSubscriberCount(null)
      }
    }

    window.addEventListener('auth:unauthorized', onUnauthorized)
    window.addEventListener('auth:logout', onUnauthorized)
    window.addEventListener('auth:login', onAuthLogin)

    return () => {
      window.removeEventListener('auth:unauthorized', onUnauthorized)
      window.removeEventListener('auth:logout', onUnauthorized)
      window.removeEventListener('auth:login', onAuthLogin)
    }
  }, [handleUnauthorized])

  // Show/hide upload
  const showUpload = useCallback(() => {
    setPromoActive(false)
    setDailyActive(false)
    setUploadActive(true)
    setUploadStep(1)
  }, [])

  const hideUpload = useCallback(() => {
    setUploadActive(false)
    setDailyActive(false)
    setPromoActive(false)
  }, [])

  // Navigate upload steps
  const nextUpload = useCallback(() => {
    setUploadStep(prev => Math.min(prev + 1, 3))
  }, [])

  const prevUpload = useCallback(() => {
    setUploadStep(prev => Math.max(prev - 1, 1))
  }, [])

  // Toggle theater mode
  const goTheater = useCallback(() => {
    setTheaterMode((prev) => {
      const next = !prev

      if (next) {
        // Entering theater should always surface the player area.
        setDailyActive(true)
        setPromoActive(false)
        setSignupActive(false)
        setLoginActive(false)
        setUploadActive(false)
      }

      return next
    })
  }, [])

  // Single callback for player fullscreen/theater: hide all overlays (replaces calls in original goTheater/fullscreen)
  const onHideOverlays = useCallback(() => {
    setSignupActive(false)
    setLoginActive(false)
    setPromoActive(false)
    setUploadActive(false)
  }, [])

  // Successful login: mark authenticated, hide login, and go to Post page
  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true)
    setSubscriberCount(getStoredSubscriberCount() ?? DEFAULT_AUTH_SUBSCRIBER_COUNT)
    setLoginActive(false)
    setSignupActive(false)
    setPromoActive(false)
    // Clear promo dismissed flag so it shows again on next logout
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('promo_dismissed')
      }
    } catch {
      // ignore
    }
    navigate('/studio/migrate')
  }, [navigate])

  useEffect(() => {
    if (isAuthenticated) {
      return
    }

    const isPostRoute = location.pathname === '/post' || location.pathname === '/studio/migrate'
    if (!isPostRoute) {
      return
    }

    setPromoActive(false)
    setSignupActive(false)
    setUploadActive(false)
    setDailyActive(false)
    setLoginActive(true)
    navigate('/login', { replace: true })
  }, [isAuthenticated, location.pathname, navigate])
  
  // Check authentication status on mount and route changes
  useEffect(() => {
    let auth = false
    try {
      auth = checkAuth()
    } catch {
      auth = false
    }

    setIsAuthenticated(auth)
    setSubscriberCount(auth ? (getStoredSubscriberCount() ?? DEFAULT_AUTH_SUBSCRIBER_COUNT) : null)
    
    // Keep home defaulting to the promo/content page.
    // Only auto-open daily when promo is not active.
    if (auth && location.pathname === '/' && !promoActive) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const stored = localStorage.getItem(STORAGE_DAILY_VISIBLE)
          if (stored !== 'false') {
            setDailyActive(true)
          }
        }
      } catch {
        // ignore
      }
    }
  }, [location.pathname, promoActive])

  // Switch browser page
  const switchPage = useCallback((pageId) => {
    setActiveBrowserPage(pageId)
  }, [])

  // Open Settings view (from right sidebar)
  const openSettings = useCallback((sectionId) => {
    setSlideoutVisible(false)
    if (sectionId) {
      navigate(`/settings?section=${encodeURIComponent(sectionId)}`)
      return
    }
    navigate('/settings')
  }, [navigate])

  const openThemeDesigner = useCallback(() => {
    navigate('/theme-designer')
  }, [navigate])

  const openChannel = useCallback(() => {
    navigate('/channel')
  }, [navigate])

  const openFaq = useCallback(() => {
    setSlideoutVisible(false)
    navigate('/faq')
  }, [navigate])

  const handlePersonalizationSettingChange = useCallback((settingKey, isEnabled) => {
    if (!(settingKey in DEFAULT_PERSONALIZATION_EFFECTS)) {
      return
    }

    setPersonalizationEffects((prev) => ({
      ...prev,
      [settingKey]: Boolean(isEnabled),
    }))
  }, [])

  const handleChannelPosterTextChange = useCallback((nextText) => {
    const normalized = String(nextText ?? '').slice(0, 28)
    setChannelPosterText(normalized)
  }, [])

  const handleChannelPosterEnabledChange = useCallback((isEnabled) => {
    setChannelPosterEnabled(Boolean(isEnabled))
  }, [])

  // Handle theme color change
  const handleColorChange = useCallback((color) => {
    const contrast = getThemeContrast(color)
    setThemeColor(color)
    document.documentElement.style.setProperty('--theme-color', color)
    document.documentElement.style.setProperty('--theme-color-dark', darkenColor(color, 0.15))
    document.documentElement.style.setProperty('--theme-on-color', contrast.onColor)
    document.documentElement.style.setProperty('--theme-on-color-muted', contrast.onColorMuted)
    document.documentElement.style.setProperty('--theme-surface-overlay', contrast.surfaceOverlay)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('themeColor', color)
      }
    } catch {
      // ignore
    }
  }, [darkenColor, getThemeContrast])

  // Open the video player from content cards (Editors' Picks / etc.)
  const handleOpenVideo = useCallback((payload = {}) => {
    const requestedVideoId = String(payload?.videoId || payload?.id || '').trim()
    const requestedSourceUrl = String(payload?.sourceUrl || payload?.source_url || payload?.video_url || '').trim()
    if (requestedSourceUrl) {
      const resolvedTitle = String(payload?.title || (requestedVideoId ? `Migrated video ${requestedVideoId}` : ''))
      const resolvedDescription = String(payload?.description || '')
      const resolvedSourceType = String(payload?.sourceType || 'creator_migrated')

      if (requestedVideoId) {
        const query = new URLSearchParams({
          src: requestedSourceUrl,
          sourceType: resolvedSourceType,
        })
        if (resolvedTitle) query.set('title', resolvedTitle)
        if (resolvedDescription) query.set('description', resolvedDescription)
        navigate(`/watch/${encodeURIComponent(requestedVideoId)}?${query.toString()}`)
      }

      setCurrentVideoSource({
        sourceType: resolvedSourceType,
        sourceUrl: requestedSourceUrl,
        title: resolvedTitle,
        description: resolvedDescription,
        discussionLink: String(payload?.discussionLink || ''),
      })
      setPromoActive(false)
      setSignupActive(false)
      setLoginActive(false)
      setUploadActive(false)
      setDailyActive(true)
      return
    }

    if (requestedVideoId) {
      navigate(`/watch/${encodeURIComponent(requestedVideoId)}`)
      setPromoActive(false)
      setSignupActive(false)
      setLoginActive(false)
      setUploadActive(false)
      setDailyActive(true)
      return
    }

    setCurrentVideoSource({ ...DEFAULT_VIDEO_SOURCE })
    setPromoActive(false)
    setSignupActive(false)
    setLoginActive(false)
    setUploadActive(false)
    setDailyActive(true)
  }, [navigate])

  const handleVideoReadyFromPost = useCallback((payload) => {
    const nextSource = {
      sourceType: String(payload?.sourceType || DEFAULT_VIDEO_SOURCE.sourceType),
      sourceUrl: String(payload?.sourceUrl || DEFAULT_VIDEO_SOURCE.sourceUrl),
      title: String(payload?.title || ''),
      description: String(payload?.description || ''),
      discussionLink: String(payload?.discussionLink || ''),
    }

    setCurrentVideoSource(nextSource)
    setPromoActive(false)
    setSignupActive(false)
    setLoginActive(false)
    setUploadActive(false)
    setDailyActive(true)
    navigate('/')
  }, [navigate])

  const buildFallbackMigrationStreamUrl = useCallback((videoId) => {
    const resolvedVideoId = String(videoId || '').trim()
    if (!resolvedVideoId) return ''

    let streamUrl = `/api/v1/video/migration/stream/${encodeURIComponent(resolvedVideoId)}`

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = String(localStorage.getItem('token') || localStorage.getItem('auth_token') || '').trim()
        const clientId = String(localStorage.getItem('client_id') || '').trim()

        if (token && clientId) {
          streamUrl += `?token=${encodeURIComponent(token)}&client_id=${encodeURIComponent(clientId)}`
        }
      }
    } catch {
      // ignore fallback stream URL token serialization errors
    }

    return streamUrl
  }, [])

  useEffect(() => {
    if (!location.pathname.startsWith('/watch/')) {
      return undefined
    }

    const pathParts = String(location.pathname || '').split('/').filter(Boolean)
    const rawVideoId = pathParts.length >= 2 ? pathParts[1] : ''
    if (!rawVideoId) {
      return undefined
    }

    let decodedVideoId = ''
    try {
      decodedVideoId = decodeURIComponent(rawVideoId)
    } catch {
      decodedVideoId = rawVideoId
    }

    const findLocalWatchVideo = () => {
      try {
        return getLocalChannelVideos().find((item) => String(item?.uuid || item?.id || '').trim() === decodedVideoId) || null
      } catch {
        return null
      }
    }

    const applyWatchSource = (streamUrl, titleFromQuery = '', sourceTypeFromQuery = '', descriptionFromQuery = '') => {
      const resolvedStreamUrl = String(streamUrl || '').trim()
      if (!resolvedStreamUrl) {
        return
      }

      const localVideo = findLocalWatchVideo()
      const resolvedTitle = String(titleFromQuery || localVideo?.title || localVideo?.name || '').trim() || `Migrated video ${decodedVideoId}`
      const resolvedDescription = String(descriptionFromQuery || localVideo?.description || '').trim()

      setCurrentVideoSource({
        sourceType: String(sourceTypeFromQuery || 'creator_migrated'),
        sourceUrl: resolvedStreamUrl,
        title: resolvedTitle,
        description: resolvedDescription,
        discussionLink: String(localVideo?.discussion_link || localVideo?.discussionLink || '').trim(),
      })
      setPromoActive(false)
      setSignupActive(false)
      setLoginActive(false)
      setUploadActive(false)
      setDailyActive(true)
      setActiveBrowserPage('browserContentPicks')
    }

    const searchParams = new URLSearchParams(String(location.search || ''))
    const srcFromQuery = String(searchParams.get('src') || '').trim()
    const titleFromQuery = String(searchParams.get('title') || '').trim()
    const sourceTypeFromQuery = String(searchParams.get('sourceType') || '').trim()
    const descriptionFromQuery = String(searchParams.get('description') || '').trim()
    if (srcFromQuery) {
      applyWatchSource(srcFromQuery, titleFromQuery, sourceTypeFromQuery, descriptionFromQuery)
      return undefined
    }

    let cancelled = false

    videoAPI.streamUrl(decodedVideoId)
      .then((response) => {
        if (cancelled) return

        const payload = response?.data || response || {}
        const resolvedStreamUrl = String(payload?.streamUrl || payload?.playbackUrl || '').trim()
        const localVideo = findLocalWatchVideo()
        const localStreamUrl = String(localVideo?.video_url || localVideo?.source_url || '').trim()

        let finalStreamUrl = resolvedStreamUrl
        if (localStreamUrl && (!resolvedStreamUrl || resolvedStreamUrl.includes('flower.mp4'))) {
          finalStreamUrl = localStreamUrl
        }

        if (finalStreamUrl) {
          applyWatchSource(finalStreamUrl)
          return
        }

        const fallback = buildFallbackMigrationStreamUrl(decodedVideoId)
        if (fallback) {
          applyWatchSource(fallback)
        }
      })
      .catch(() => {
        if (cancelled) return

        const fallback = buildFallbackMigrationStreamUrl(decodedVideoId)
        if (fallback) {
          applyWatchSource(fallback)
        }
      })

    return () => {
      cancelled = true
    }
  }, [buildFallbackMigrationStreamUrl, location.pathname, location.search])

  const handleCloseCenterPage = useCallback(() => {
    setPromoActive(false)
    setSignupActive(false)
    setLoginActive(false)
    setUploadActive(false)
    setDailyActive(false)
    navigate('/')
  }, [navigate])

  const handleLogoHome = useCallback(() => {
    setSignupActive(false)
    setLoginActive(false)
    setUploadActive(false)
    setDailyActive(false)
    setPromoActive(!isAuthenticated)
    navigate('/')
  }, [isAuthenticated, navigate])

  if (isSettingsRoute) {
    return (
      <>
        <style>{inlineStyles}</style>
        <Routes>
          <Route
            path="/settings"
            element={(
              <SettingsPage
                isAuthenticated={isAuthenticated}
                personalizationSettings={personalizationEffects}
                onPersonalizationSettingChange={handlePersonalizationSettingChange}
                onThemeColorChange={handleColorChange}
                channelPosterText={channelPosterText}
                channelPosterEnabled={channelPosterEnabled}
                onChannelPosterTextChange={handleChannelPosterTextChange}
                onChannelPosterEnabledChange={handleChannelPosterEnabledChange}
              />
            )}
          />
          <Route
            path="/theme-designer"
            element={(
              <SettingsPage
                isAuthenticated={isAuthenticated}
                personalizationSettings={personalizationEffects}
                onPersonalizationSettingChange={handlePersonalizationSettingChange}
                onThemeColorChange={handleColorChange}
                channelPosterText={channelPosterText}
                channelPosterEnabled={channelPosterEnabled}
                onChannelPosterTextChange={handleChannelPosterTextChange}
                onChannelPosterEnabledChange={handleChannelPosterEnabledChange}
              />
            )}
          />
          <Route
            path="/channel"
            element={(
              isAuthenticated
                ? (
                  <SettingsPage
                    isAuthenticated={isAuthenticated}
                    personalizationSettings={personalizationEffects}
                    onPersonalizationSettingChange={handlePersonalizationSettingChange}
                    onThemeColorChange={handleColorChange}
                    isChannelPage
                    channelPosterText={channelPosterText}
                    channelPosterEnabled={channelPosterEnabled}
                    onChannelPosterTextChange={handleChannelPosterTextChange}
                    onChannelPosterEnabledChange={handleChannelPosterEnabledChange}
                    channelContent={(
                      <ChannelPage
                        embedded
                        onOpenVideo={handleOpenVideo}
                        posterText={channelPosterText}
                        posterTextEnabled={channelPosterEnabled}
                      />
                    )}
                  />
                )
                : <Navigate to="/" replace />
            )}
          />
          <Route
            path="/faq"
            element={(
              <PageFaq isAuthenticated={isAuthenticated} />
            )}
          />
          <Route path="*" element={<Navigate to="/settings" replace />} />
        </Routes>
      </>
    )
  }

  return (
    <>
      <style>{inlineStyles}</style>

      <Titlebar
        onToggleSlideout={toggleSlideout}
        onToggleSearch={toggleSearch}
        onToggleDaily={toggleDaily}
        onShowUpload={openPostPage}
        onShowSignup={showSignup}
        onShowLogin={showLogin}
        onLogoHome={handleLogoHome}
        isAuthenticated={isAuthenticated}
        subscriberCount={subscriberCountLabel}
        searchVisible={searchVisible}
        dailyActive={dailyActive}
      />

      <Slideout
        visible={slideoutVisible}
        onColorChange={handleColorChange}
        onShowPromo={showPromo}
        onShowSignup={showSignup}
        onShowLogin={showLogin}
        onOpenSettings={openSettings}
        onOpenThemeDesigner={openThemeDesigner}
        onOpenChannel={openChannel}
        onOpenFaq={openFaq}
        onSignOut={handleSignOut}
        isAuthenticated={isAuthenticated}
      />

      <Shadow
        visible={slideoutVisible}
        onClick={toggleSlideout}
      />

      {/* Always render main content; it will manage overlays internally */}
      <Content
        isAuthenticated={isAuthenticated}
        currentPath={location.pathname}
        currentVideoSource={currentVideoSource}
        dailyActive={dailyActive}
        promoActive={promoActive}
        signupActive={signupActive}
        loginActive={loginActive}
        uploadActive={uploadActive}
        theaterMode={theaterMode}
        currentPromoSlide={currentPromoSlide}
        signupStep={signupStep}
        uploadStep={uploadStep}
        activeBrowserPage={activeBrowserPage}
        onToggleDaily={toggleDaily}
        onGoTheater={goTheater}
        onHidePromo={hidePromo}
        onNextPromo={nextPromo}
        onShowSignup={showSignup}
        onHideSignup={hideSignup}
        onNextSignup={nextSignup}
        onPrevSignup={prevSignup}
        onShowLogin={handleRequestLogin}
        onHideLogin={hideLogin}
        onShowUpload={showUpload}
        onHideUpload={hideUpload}
        onNextUpload={nextUpload}
        onPrevUpload={prevUpload}
        onSwitchPage={switchPage}
        onColorChange={handleColorChange}
        onHideOverlays={onHideOverlays}
        onLoginSuccess={handleLoginSuccess}
        onOpenVideo={handleOpenVideo}
        onVideoReadyFromPost={handleVideoReadyFromPost}
        onCloseCenterPage={handleCloseCenterPage}
        themeColor={themeColor}
      />

      <Routes>
        <Route
          path="/post"
          element={<Navigate to={isAuthenticated ? '/studio/migrate' : '/login'} replace />}
        />
        <Route
          path="/studio/migrate"
          element={isAuthenticated ? null : <Navigate to="/login" replace />}
        />
        <Route path="/login" element={null} />
        <Route path="/watch/:videoId" element={null} />
        <Route path="/auth/:provider/callback" element={<OAuthCallback />} />
        <Route path="/auth/google/callback" element={<OAuthCallback />} />
        <Route path="/auth/facebook/callback" element={<OAuthCallback />} />
        <Route path="/auth/dropbox/callback" element={<OAuthCallback />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
