import { memo, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import ColorPicker from './ColorPicker'

const Slideout = memo(function Slideout({ visible, onColorChange, onShowPromo, onOpenSettings }) {
  const location = useLocation()
  const isSettingsPage = location.pathname === '/settings'

  const handleShowPromo = useCallback(() => {
    if (typeof onShowPromo === 'function') onShowPromo()
  }, [onShowPromo])

  const handleOpenSettings = useCallback(() => {
    if (typeof onOpenSettings === 'function') onOpenSettings()
  }, [onOpenSettings])

  return (
    <aside
      id="slideout"
      className={`slideout ${visible ? '' : 'hidden'}`}
      role="complementary"
      aria-label="Side menu"
      aria-hidden={!visible}
    >
      <nav className="slideout-account" aria-label="Account options">
        <button className="slideout-entry" role="menuitem">
          View Profile
          <i className="material-icons" aria-hidden="true">account_circle</i>
        </button>
        <button className="slideout-entry" id="showit" role="menuitem" onClick={handleShowPromo}>
          Sign Out
          <i className="material-icons" aria-hidden="true">exit_to_app</i>
        </button>
      </nav>

      <nav className="slideout-technical" aria-label="Help and settings">
        <button className="slideout-entry" role="menuitem">
          Frequent Questions
          <i className="material-icons" aria-hidden="true">help</i>
        </button>
        <button
          className={`slideout-entry ${isSettingsPage ? 'active' : ''}`}
          role="menuitem"
          onClick={handleOpenSettings}
        >
          Settings
          <i className="material-icons" aria-hidden="true">settings</i>
        </button>
      </nav>

      <div className="slideout-bottom">
        <ColorPicker onColorChange={onColorChange} />
      </div>
    </aside>
  )
})

export default Slideout
