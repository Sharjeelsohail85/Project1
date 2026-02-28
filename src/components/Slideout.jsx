import { memo, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import ColorPicker from './ColorPicker'

const Slideout = memo(function Slideout({
  visible,
  onColorChange,
  onShowPromo,
  onShowSignup,
  onShowLogin,
  onOpenSettings,
  onOpenChannel,
  onOpenFaq,
  onOpenThemeDesigner,
  onSignOut,
  isAuthenticated = false,
}) {
  const location = useLocation()
  const isSettingsPage = location.pathname === '/settings'
  const isChannelPage = location.pathname === '/channel'
  const isFaqPage = location.pathname === '/faq'
  const isThemeDesignerPage = location.pathname === '/theme-designer'

  const handleShowPromo = useCallback(() => {
    if (typeof onShowPromo === 'function') onShowPromo()
  }, [onShowPromo])

  const handleOpenSettings = useCallback(() => {
    if (typeof onOpenSettings === 'function') onOpenSettings()
  }, [onOpenSettings])

  const handleShowSignup = useCallback(() => {
    if (typeof onShowSignup === 'function') {
      onShowSignup()
      return
    }

    handleShowPromo()
  }, [handleShowPromo, onShowSignup])

  const handleShowLogin = useCallback(() => {
    if (typeof onShowLogin === 'function') {
      onShowLogin()
      return
    }

    handleShowPromo()
  }, [handleShowPromo, onShowLogin])

  const handleOpenThemeDesigner = useCallback(() => {
    if (typeof onOpenThemeDesigner === 'function') onOpenThemeDesigner()
  }, [onOpenThemeDesigner])

  const handleOpenChannel = useCallback(() => {
    if (typeof onOpenChannel === 'function') onOpenChannel()
  }, [onOpenChannel])

  const handleOpenFaq = useCallback(() => {
    if (typeof onOpenFaq === 'function') {
      onOpenFaq()
      return
    }
    if (typeof window === 'undefined') return
    window.location.assign('/faq')
  }, [onOpenFaq])

  const handleOpenTerms = useCallback(() => {
    if (typeof window === 'undefined') return
    window.open('/TERMS_AND_CONDITIONS.md', '_blank', 'noopener,noreferrer')
  }, [])

  const handleOpenPrivacy = useCallback(() => {
    if (typeof window === 'undefined') return
    window.open('/PRIVACY_POLICY.md', '_blank', 'noopener,noreferrer')
  }, [])

  const handleSignOut = useCallback(() => {
    if (typeof onSignOut === 'function') {
      onSignOut()
      return
    }
    handleShowPromo()
  }, [handleShowPromo, onSignOut])

  return (
    <aside
      id="slideout"
      className={`slideout ${visible ? '' : 'hidden'}`}
      style={{
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      role="complementary"
      aria-label="Side menu"
      aria-hidden={!visible}
    >
      <nav className="slideout-technical" aria-label="Menu options">
        {!isAuthenticated ? (
          <>
            <button className="slideout-entry" role="menuitem" onClick={handleShowSignup}>
              Sign Up
              <i className="material-icons" aria-hidden="true">person_add</i>
            </button>
            <button className="slideout-entry" role="menuitem" onClick={handleShowLogin}>
              Log In
              <i className="material-icons" aria-hidden="true">exit_to_app</i>
            </button>
          </>
        ) : null}

        {isAuthenticated ? (
          <button
            className={`slideout-entry ${isChannelPage ? 'active' : ''}`}
            role="menuitem"
            onClick={handleOpenChannel}
          >
            Channel
            <i className="material-icons" aria-hidden="true">podcasts</i>
          </button>
        ) : null}
        {isAuthenticated ? (
          <button
            className={`slideout-entry ${isSettingsPage && !isChannelPage ? 'active' : ''}`}
            role="menuitem"
            onClick={handleOpenSettings}
          >
            Settings
            <i className="material-icons" aria-hidden="true">settings</i>
          </button>
        ) : null}

        <button className={`slideout-entry ${isFaqPage ? 'active' : ''}`} role="menuitem" onClick={handleOpenFaq}>
          Frequently Asked Questions
          <i className="material-icons" aria-hidden="true">help</i>
        </button>
        <button className="slideout-entry" role="menuitem" onClick={handleOpenTerms}>
          Terms &amp; Conditions
          <i className="material-icons" aria-hidden="true">gavel</i>
        </button>
        <button className="slideout-entry" role="menuitem" onClick={handleOpenPrivacy}>
          Privacy Policy
          <i className="material-icons" aria-hidden="true">policy</i>
        </button>

        {isAuthenticated ? (
          <button className="slideout-entry" id="showit" role="menuitem" onClick={handleSignOut}>
            Log Out
            <i className="material-icons" aria-hidden="true">exit_to_app</i>
          </button>
        ) : (
          <>
            <button
              className={`slideout-entry ${isThemeDesignerPage ? 'active' : ''}`}
              role="menuitem"
              onClick={handleOpenThemeDesigner}
            >
              Theme Designer
              <i className="material-icons" aria-hidden="true">format_paint</i>
            </button>
          </>
        )}
      </nav>

      <div className="slideout-bottom">
        <ColorPicker onColorChange={onColorChange} />
      </div>
    </aside>
  )
})

export default Slideout
