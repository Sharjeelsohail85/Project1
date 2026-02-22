import { memo, useCallback, useState } from 'react'
import Daily from './Daily'
import PromoOverlay from './PromoOverlay'
import Upload from './Upload'
import Signup from './Signup'
import Login from './Login'

const TopWrap = memo(function TopWrap({
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
  onColorChange,
  onHideOverlays,
  onLoginSuccess,
  onCloseCenterPage,
  themeColor
}) {
  const [dailyCommentsExpanded, setDailyCommentsExpanded] = useState(false)

  const handleCommentsToggle = useCallback((isOpen) => {
    setDailyCommentsExpanded(Boolean(isOpen))
  }, [])

  // Only reserve hero layout space for sections that render inline inside .top-wrap.
  // Login is rendered via a portal, so including it here creates an empty 400px gap.
  const hasActiveCenter = dailyActive || promoActive || signupActive || uploadActive
  const topWrapClassName = `top-wrap ${hasActiveCenter ? 'active' : 'collapsed'} ${dailyActive && theaterMode ? 'theater-active' : ''} ${dailyActive && dailyCommentsExpanded ? 'comments-expanded' : ''}`

  return (
    <div id="topWrap" className={topWrapClassName}>
      {/* Only render the Daily player when it is active to avoid layout artifacts */}
      {dailyActive && (
        <Daily
          active={dailyActive}
          currentVideoSource={currentVideoSource}
          theaterMode={theaterMode}
          onToggleDaily={onToggleDaily}
          onGoTheater={onGoTheater}
          onCommentsToggle={handleCommentsToggle}
          onHideOverlays={onHideOverlays}
          themeColor={themeColor}
        />
      )}
      
      <PromoOverlay
        active={promoActive}
        currentSlide={currentPromoSlide}
        onHidePromo={onCloseCenterPage || onHidePromo}
        onNextPromo={onNextPromo}
        onShowSignup={onShowSignup}
        onShowLogin={onShowLogin}
      />
      
      <Upload
        active={uploadActive}
        step={uploadStep}
        onHideUpload={onCloseCenterPage || onHideUpload}
        onNextUpload={onNextUpload}
        onPrevUpload={onPrevUpload}
      />
      
      <Signup
        active={signupActive}
        step={signupStep}
        onHideSignup={onCloseCenterPage || onHideSignup}
        onNextSignup={onNextSignup}
        onPrevSignup={onPrevSignup}
        onColorChange={onColorChange}
      />
      
      <Login
        active={loginActive}
        onHideLogin={onCloseCenterPage || onHideLogin}
        onLoginSuccess={onLoginSuccess}
      />
    </div>
  )
})

export default TopWrap
