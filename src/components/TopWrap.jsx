import { memo } from 'react'
import Daily from './Daily'
import PromoOverlay from './PromoOverlay'
import Upload from './Upload'
import Signup from './Signup'
import Login from './Login'

const TopWrap = memo(function TopWrap({
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
  const hasActiveCenter = dailyActive || promoActive || signupActive || loginActive || uploadActive

  return (
    <div id="topWrap" className={`top-wrap ${hasActiveCenter ? 'active' : 'collapsed'}`}>
      {/* Only render the Daily player when it is active to avoid layout artifacts */}
      {dailyActive && (
        <Daily
          active={dailyActive}
          theaterMode={theaterMode}
          onToggleDaily={onToggleDaily}
          onGoTheater={onGoTheater}
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
        onLoginSuccess={onLoginSuccess}
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
