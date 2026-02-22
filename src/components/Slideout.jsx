import { memo, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import ColorPicker from './ColorPicker'

const Slideout = memo(function Slideout({
  visible,
  onColorChange,
  onShowPromo,
  onOpenSettings,
  onOpenThemeDesigner,
  onSignOut,
  isAuthenticated = false,
}) {
  const location = useLocation()
  const isSettingsPage = location.pathname === '/settings'

  const handleShowPromo = useCallback(() => {
    if (typeof onShowPromo === 'function') onShowPromo()
  }, [onShowPromo])

  const handleOpenSettings = useCallback(() => {
    if (typeof onOpenSettings === 'function') onOpenSettings()
  }, [onOpenSettings])

  const handleOpenThemeDesigner = useCallback(() => {
    if (typeof onOpenThemeDesigner === 'function') onOpenThemeDesigner()
  }, [onOpenThemeDesigner])

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
      role="complementary"
      aria-label="Side menu"
      aria-hidden={!visible}
    >
      <nav className="slideout-technical" aria-label="Menu options">
        <button className="slideout-entry" role="menuitem">
          Frequent Questions
          <i className="material-icons" aria-hidden="true">help</i>
        </button>
        <button className="slideout-entry" role="menuitem" onClick={handleOpenThemeDesigner}>
          Theme Designer
          <i className="material-icons" aria-hidden="true">format_paint</i>
        </button>
        {isAuthenticated ? (
          <button
            className={`slideout-entry ${isSettingsPage ? 'active' : ''}`}
            role="menuitem"
            onClick={handleOpenSettings}
          >
            Settings
            <i className="material-icons" aria-hidden="true">settings</i>
          </button>
        ) : null}
        {isAuthenticated ? (
          <button className="slideout-entry" id="showit" role="menuitem" onClick={handleSignOut}>
            Sign Out
            <i className="material-icons" aria-hidden="true">exit_to_app</i>
          </button>
        ) : null}
      </nav>

      <div className="slideout-bottom">
        <ColorPicker onColorChange={onColorChange} />
      </div>
    </aside>
  )
})

export default Slideout
