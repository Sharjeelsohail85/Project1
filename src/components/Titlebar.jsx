import { memo } from 'react'
import { useNavigate } from 'react-router-dom'

const Titlebar = memo(function Titlebar({
  onToggleSlideout,
  onToggleSearch,
  onToggleDaily,
  onShowUpload,
  onLogoHome,
  searchVisible,
  dailyActive
}) {
  const navigate = useNavigate()

  const handleSearchClick = () => {
    onToggleSearch?.()
  }

  const handleLogoClick = () => {
    if (typeof onLogoHome === 'function') {
      onLogoHome()
      return
    }
    navigate('/')
  }

  return (
    <header id="titlebar" className="titlebar" role="banner">
      {/* Logo Section */}
      <div id="logoBox" className="titlebar-box titlebar-left">
        <div 
          id="titlebarLogo" 
          className="titlebar-item titlebar-left-item titlebar-logo"
          onClick={handleLogoClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleLogoClick()
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <i className="material-icons" aria-hidden="true">play_circle_filled</i>
          <span>Logo</span>
        </div>
      </div>

      {/* Navigation Section */}
      <nav id="navBox" className="titlebar-box titlebar-center" role="navigation" aria-label="Main navigation">
        <button
          id="titlebarSearchButton"
          className="titlebar-item titlebar-center-item titlebar-search-button button"
          onClick={handleSearchClick}
          aria-label="Open search"
        >
          <i className="material-icons" aria-hidden="true">search</i>
          <span>Search</span>
        </button>
        
        <button
          id="titlebarPost"
          className="titlebar-item titlebar-center-item titlebar-post-button button"
          onClick={() => onShowUpload?.()}
          aria-label="Post content"
        >
          <i className="material-icons" aria-hidden="true">cloud_upload</i>
          <span>Post</span>
        </button>
        
        <button
          id="titlebarDaily"
          className={`titlebar-item titlebar-center-item titlebar-daily button ${dailyActive ? 'hidden' : ''}`}
          onClick={() => onToggleDaily?.()}
          aria-label="Open player"
        >
          <i className="material-icons" aria-hidden="true">view_agenda</i>
          <span>Player</span>
        </button>
      </nav>

      {/* Search Bar */}
      <div
        id="titlebarSearch"
        className={`titlebar-search ${searchVisible ? '' : 'hidden'}`}
        role="search"
      >
        <button
          id="titlebarSearchBack"
          className="material-icons"
          onClick={() => onToggleSearch?.()}
          aria-label="Close search"
        >
          arrow_back
        </button>
        <input
          id="titlebarSearchInput"
          className="titlebar-search-input input"
          placeholder="Search"
          type="search"
          aria-label="Search input"
        />
        <button
          id="titlebarSearchGo"
          className="material-icons"
          aria-label="Submit search"
        >
          search
        </button>
      </div>

      {/* Account/Menu Section */}
      <div id="accountBox" className="titlebar-box titlebar-right">
        <button
          id="titlebarMenu"
          className="titlebar-item titlebar-left-item titlebar-menu"
          onClick={() => onToggleSlideout?.()}
          aria-label="Open menu"
          aria-expanded="false"
        >
          <i className="material-icons" aria-hidden="true">menu</i>
        </button>
      </div>
    </header>
  )
})

export default Titlebar
