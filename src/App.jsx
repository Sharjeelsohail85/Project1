import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Titlebar from './components/Titlebar'
import Slideout from './components/Slideout'
import Shadow from './components/Shadow'
import Content from './components/Content'
import SettingsPage from './components/SettingsPage'
import ChannelPage from './components/ChannelPage'
import { DEFAULT_VIDEO_SOURCE } from './utils/videoSource'
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
  const isSettingsRoute = location.pathname === '/settings' || location.pathname === '/theme-designer' || location.pathname === '/channel'
  
  // Check authentication status on mount
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return checkAuth()
    } catch {
      return false
    }
  })
  
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
    setPromoActive(false)
    setSignupActive(false)
    setLoginActive(false)
    setUploadActive(false)
    setDailyActive(false)
    setSignupStep(1)
    setUploadStep(1)
    navigate('/post')
  }, [navigate])

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
  }, [])

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
        setIsAuthenticated(checkAuth())
      } catch {
        setIsAuthenticated(false)
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
    navigate('/post')
  }, [navigate])
  
  // Check authentication status on mount and route changes
  useEffect(() => {
    let auth = false
    try {
      auth = checkAuth()
    } catch {
      auth = false
    }

    setIsAuthenticated(auth)
    
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
  const handleOpenVideo = useCallback(() => {
    setCurrentVideoSource({ ...DEFAULT_VIDEO_SOURCE })
    setPromoActive(false)
    setSignupActive(false)
    setLoginActive(false)
    setUploadActive(false)
    setDailyActive(true)
  }, [])

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
    setPromoActive(true)
    navigate('/')
  }, [navigate])

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
        onLogoHome={handleLogoHome}
        searchVisible={searchVisible}
        dailyActive={dailyActive}
      />

      <Slideout
        visible={slideoutVisible}
        onColorChange={handleColorChange}
        onShowPromo={showPromo}
        onOpenSettings={openSettings}
        onOpenThemeDesigner={openThemeDesigner}
        onOpenChannel={openChannel}
        onSignOut={handleSignOut}
        isAuthenticated={isAuthenticated}
      />

      <Shadow
        visible={slideoutVisible}
        onClick={toggleSlideout}
      />

      {/* Always render main content; it will manage overlays internally */}
      <Content
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
        <Route path="/post" element={null} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
