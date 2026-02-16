import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Titlebar from './components/Titlebar'
import Slideout from './components/Slideout'
import Shadow from './components/Shadow'
import Content from './components/Content'
import SettingsPage from './components/SettingsPage'
import { isAuthenticated as checkAuth } from './services/auth.service'
import './styles/global.css'
import './styles/design-system.css'

// Persistence keys (replaces Cookies from original)
const STORAGE_DAILY_VISIBLE = 'dailyVisible'
const STORAGE_CURRENT_PAGE = 'currentPage'

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
  const isSettingsRoute = location.pathname === '/settings'
  
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
  
  // Show promo hero by default when not authenticated so the
  // white space under the titlebar is always filled with either
  // promo, signup, login, or the daily player.
  const [promoActive, setPromoActive] = useState(() => {
    try {
      return !checkAuth()
    } catch {
      return true
    }
  })
  const [signupActive, setSignupActive] = useState(false)
  
  const [loginActive, setLoginActive] = useState(false)
  const [uploadActive, setUploadActive] = useState(false)
  const [theaterMode, setTheaterMode] = useState(false)
  const [currentPromoSlide, setCurrentPromoSlide] = useState(0)
  const [signupStep, setSignupStep] = useState(1)
  const [uploadStep, setUploadStep] = useState(1)
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
    setDailyActive(prev => !prev)
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
    setPromoActive(false)
    setLoginActive(true)
    navigate('/')
  }, [navigate])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const onUnauthorized = () => {
      handleUnauthorized()
    }

    window.addEventListener('auth:unauthorized', onUnauthorized)
    window.addEventListener('auth:logout', onUnauthorized)

    return () => {
      window.removeEventListener('auth:unauthorized', onUnauthorized)
      window.removeEventListener('auth:logout', onUnauthorized)
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
    setTheaterMode(prev => !prev)
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
    
    // If authenticated and on home page, show daily player if preferred.
    // Promo/login/signup visibility is now controlled purely by their own
    // state so the main hero text and buttons can always render when needed.
    if (auth && location.pathname === '/') {
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
  }, [location.pathname])

  // Switch browser page
  const switchPage = useCallback((pageId) => {
    setActiveBrowserPage(pageId)
  }, [])

  // Open Settings view (from right sidebar)
  const openSettings = useCallback(() => {
    setSlideoutVisible(false)
    navigate('/settings')
  }, [navigate])

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
    setPromoActive(false)
    setSignupActive(false)
    setLoginActive(false)
    setUploadActive(false)
    setDailyActive(true)
  }, [])

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
          <Route path="/settings" element={<SettingsPage />} />
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
      />

      <Shadow
        visible={slideoutVisible}
        onClick={toggleSlideout}
      />

      {/* Always render main content; it will manage overlays internally */}
      <Content
        currentPath={location.pathname}
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
