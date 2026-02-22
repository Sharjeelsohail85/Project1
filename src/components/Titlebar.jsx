import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import logoOctopus from '../../resources/logo-octopus.png'

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
        <Box
          id="titlebarLogo" 
          className="titlebar-item titlebar-left-item titlebar-logo"
          onClick={handleLogoClick}
          role="button"
          aria-label="Go to home"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleLogoClick()
            }
          }}
          sx={{
            cursor: 'pointer',
            transform: 'translateY(-26px)',
            backgroundColor: 'transparent !important',
            '&:hover': { backgroundColor: 'transparent !important' },
            '&:active': { backgroundColor: 'transparent !important' }
          }}
        >
          <Box
            component="img"
            className="titlebar-logo-image"
            src={logoOctopus}
            alt="Octopussol logo"
            sx={{
              width: 63,
              height: 63,
              minWidth: 63,
              minHeight: 63,
              maxWidth: 63,
              maxHeight: 63,
              display: 'block',
              objectFit: 'contain',
              backgroundColor: 'transparent !important',
              border: '0 !important',
              boxShadow: 'none !important',
              borderRadius: '0 !important'
            }}
          />
          <Typography
            className="titlebar-logo-deco"
            component="span"
            variant="subtitle1"
            aria-hidden="true"
            sx={{
              textDecoration: 'none !important',
              textDecorationLine: 'none',
              textTransform: 'none',
              letterSpacing: 0,
              lineHeight: 1,
              fontWeight: 600,
              position: 'static',
              p: 0,
              m: 0,
              backgroundColor: 'transparent !important',
              border: '0 !important'
            }}
          >
            octopussol
          </Typography>
          <span className="titlebar-logo-text">Octopussol</span>
        </Box>
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
