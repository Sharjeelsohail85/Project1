import { memo, useRef, useEffect } from 'react'
import TopWrap from './TopWrap'
import BrowserNav from './BrowserNav'
import Browser from './Browser'
import PostPage from './PostPage'
import MigratePostPage from '../pages/Studio/MigratePostPage'
import useSmoothWheelScroll from '../hooks/useSmoothWheelScroll'

const Content = memo(function Content({
  currentPath,
  isAuthenticated,
  currentVideoSource,
  dailyActive,
  promoActive,
  signupActive,
  loginActive,
  uploadActive,
  theaterMode,
  currentPromoSlide,
  signupStep,
  uploadStep,
  activeBrowserPage,
  onToggleDaily,
  onGoTheater,
  onHidePromo,
  onNextPromo,
  onShowSignup,
  onHideSignup,
  onNextSignup,
  onPrevSignup,
  onShowLogin,
  onHideLogin,
  onShowUpload,
  onHideUpload,
  onNextUpload,
  onPrevUpload,
  onSwitchPage,
  onColorChange,
  onHideOverlays,
  onLoginSuccess,
  onOpenVideo,
  onVideoReadyFromPost,
  onCloseCenterPage,
  themeColor
}) {
  const contentRef = useRef(null)
  const isModalOpen = signupActive || loginActive || uploadActive
  const isPostRoute = currentPath === '/post'
  const isStudioMigrateRoute = currentPath === '/studio/migrate'
  const isCenterPageRoute = isPostRoute || isStudioMigrateRoute
  const canAccessCenterPage = isCenterPageRoute && isAuthenticated
  const contentClass = `content ${!dailyActive ? 'alternate' : ''} ${isModalOpen ? 'modal-open' : ''}`

  useSmoothWheelScroll(contentRef, {
    // Temporarily disable custom wheel interception to restore native page scrolling reliability.
    enabled: false,
    damping: 0.1,
    wheelMultiplier: 1.15,
    maxDelta: 220,
    usePageFallback: false
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [dailyActive])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
      }
    }
  }, [isModalOpen])
  
  // If we are on an OAuth callback path, do not render any main page contents/overlays
  if ((currentPath && currentPath.startsWith('/auth/')) || (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/'))) {
    return null
  }

  return (
      <main
  id="content"
  ref={contentRef}
  className={contentClass}
  role="main"
>

      {canAccessCenterPage ? (
        isStudioMigrateRoute
          ? <MigratePostPage />
          : <PostPage onClose={onCloseCenterPage} onVideoReady={onVideoReadyFromPost} />
      ) : (
        <TopWrap
          currentVideoSource={currentVideoSource}
          isAuthenticated={isAuthenticated}
          dailyActive={dailyActive}
          promoActive={promoActive}
          signupActive={signupActive}
          loginActive={loginActive}
          uploadActive={uploadActive}
          theaterMode={theaterMode}
          currentPromoSlide={currentPromoSlide}
          signupStep={signupStep}
          uploadStep={uploadStep}
          onToggleDaily={onToggleDaily}
          onGoTheater={onGoTheater}
          onHidePromo={onHidePromo}
          onNextPromo={onNextPromo}
          onShowSignup={onShowSignup}
          onHideSignup={onHideSignup}
          onNextSignup={onNextSignup}
          onPrevSignup={onPrevSignup}
          onShowLogin={onShowLogin}
          onHideLogin={onHideLogin}
          onShowUpload={onShowUpload}
          onHideUpload={onHideUpload}
          onNextUpload={onNextUpload}
          onPrevUpload={onPrevUpload}
          onColorChange={onColorChange}
          onHideOverlays={onHideOverlays}
          onLoginSuccess={onLoginSuccess}
          onCloseCenterPage={onCloseCenterPage}
          themeColor={themeColor}
        />
      )}

      <BrowserNav
        activePage={activeBrowserPage}
        onSwitchPage={onSwitchPage}
      />

      {!isCenterPageRoute && !isModalOpen && (
        <Browser
          activePage={activeBrowserPage}
          onOpenVideo={onOpenVideo}
        />
      )}
    </main>
  )
})

export default Content
