import { memo, useRef, useEffect } from 'react'
import TopWrap from './TopWrap'
import BrowserNav from './BrowserNav'
import Browser from './Browser'
import PostPage from './PostPage'

const Content = memo(function Content({
  currentPath,
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
  onCloseCenterPage,
  themeColor
}) {
  const contentRef = useRef(null)
  const isModalOpen = signupActive || loginActive || uploadActive
  const isPostRoute = currentPath === '/post'
  const contentClass = `content ${!dailyActive ? 'alternate' : ''} ${isModalOpen ? 'modal-open' : ''}`

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      el.scrollTop = 0
    }
  }, [dailyActive])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
  
    if (loginActive) {
      el.style.overflow = 'hidden'
    } else {
      el.style.overflow = ''
    }
  }, [loginActive])
  

  return (
      <main
  id="content"
  ref={contentRef}
  className={contentClass}
  role="main"
>

      {isPostRoute ? (
        <PostPage onClose={onCloseCenterPage} />
      ) : (
        <TopWrap
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

      {!isPostRoute && !isModalOpen && (
        <Browser
          activePage={activeBrowserPage}
          onOpenVideo={onOpenVideo}
        />
      )}
    </main>
  )
})

export default Content
