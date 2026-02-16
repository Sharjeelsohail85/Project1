import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ColorPicker from './ColorPicker'
import './SettingsPage.css'

function animateScrollTop(element, to, durationMs) {
  if (!element) return

  const from = element.scrollTop
  if (from === to) return

  const start = performance.now()
  const diff = to - from

  function tick(now) {
    const elapsed = now - start
    const t = Math.min(1, elapsed / durationMs)
    // easeOutQuad (close enough to jQuery animate for this use)
    const eased = 1 - (1 - t) * (1 - t)
    element.scrollTop = from + diff * eased
    if (t < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const columnLeftRef = useRef(null)
  const contentMainRef = useRef(null)
  const settingsSearchRef = useRef(null)
  const toggleInputRefs = useRef({})

  const [slideoutVisible, setSlideoutVisible] = useState(false)
  const [shadowDisplay, setShadowDisplay] = useState('none')
  const [shadowHiddenClass, setShadowHiddenClass] = useState(true)
  const [slideoutHiddenClass, setSlideoutHiddenClass] = useState(true)

  const [columnLeftScrollTop, setColumnLeftScrollTop] = useState(0)
  const [contentMainScrollTop, setContentMainScrollTop] = useState(0)
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [activeNavIndex, setActiveNavIndex] = useState(null)

  const darkenColor = (hex, percent = 0.15) => {
    const normalized = String(hex || '').trim().replace('#', '')
    const full = normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized.padStart(6, '0').slice(0, 6)

    const num = parseInt(full, 16)
    const r = Math.max(0, Math.floor((num >> 16) * (1 - percent)))
    const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent)))
    const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent)))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  const getThemeContrast = (hex) => {
    const normalized = String(hex || '').trim().replace('#', '')
    const full = normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized.padStart(6, '0').slice(0, 6)

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
  }

  const applyThemeColor = (color) => {
    const contrast = getThemeContrast(color)
    document.documentElement.style.setProperty('--theme-color', color)
    document.documentElement.style.setProperty('--theme-color-dark', darkenColor(color, 0.15))
    document.documentElement.style.setProperty('--theme-on-color', contrast.onColor)
    document.documentElement.style.setProperty('--theme-on-color-muted', contrast.onColorMuted)
    document.documentElement.style.setProperty('--theme-surface-overlay', contrast.surfaceOverlay)
  }

  useEffect(() => {
    const prevTitle = document.title
    document.title = 'Settings'
    return () => {
      document.title = prevTitle
    }
  }, [])

  // Mirror original script.js slideout timing behavior
  useEffect(() => {
    let t50
    let t150

    if (slideoutVisible) {
      setSlideoutHiddenClass(false)
      setShadowDisplay('block')
      setShadowHiddenClass(true)
      t50 = setTimeout(() => setShadowHiddenClass(false), 50)
    } else {
      setSlideoutHiddenClass(true)
      setShadowHiddenClass(true)
      t150 = setTimeout(() => setShadowDisplay('none'), 150)
    }

    return () => {
      if (t50) clearTimeout(t50)
      if (t150) clearTimeout(t150)
    }
  }, [slideoutVisible])

  const titlebarActive = searchFocused || columnLeftScrollTop > 5 || contentMainScrollTop > 5
  const settingsSearchParentActive = searchFocused || columnLeftScrollTop > 5

  const sections = useMemo(
    () => [
      {
        id: 'section1',
        title: 'Account',
        items: [
          'Change a setting that exists in this box',
          'Change a setting that exists in this box',
          'Change a setting that exists in this box',
        ],
      },
      {
        id: 'section2',
        title: 'Privacy',
        items: [
          'Change a setting that exists in this box',
          'Change a setting that exists in this box',
          'Change a setting that exists in this box',
        ],
      },
      {
        id: 'section3',
        title: 'Tags',
        items: [
          'Change a setting that exists in this box',
          'Change a setting that exists in this box',
          'Change a setting that exists in this box',
        ],
      },
      {
        id: 'section4',
        title: 'Personalization',
        items: [
          'Change a setting that exists in this box',
          'Change a setting that exists in this box',
          'Change a setting that exists in this box',
        ],
      },
      {
        id: 'section5',
        title: 'Channel',
        items: [
          'Change a setting that exists in this box',
          'Change a setting that exists in this box',
          'Change a setting that exists in this box',
        ],
      },
      // NOTE: Original HTML uses duplicate id="section5" for this last section; we keep the visual/content same,
      // but give it a distinct React key (index) and a unique toggle ids per row.
      {
        id: 'section5',
        title: 'Miscilanious',
        items: [
          'Change a setting that exists in this box',
          'Change a setting that exists in this box',
          'Change a unique setting that exists in this box',
        ],
      },
    ],
    [],
  )

  const navItems = useMemo(
    () => [
      { icon: 'account_circle', label: 'Account' },
      { icon: 'fingerprint', label: 'Privacy' },
      { icon: 'loyalty', label: 'Tags' },
      { icon: 'format_paint', label: 'Personalization', dataScrollto: 'section4' },
      { icon: 'settings_input_antenna', label: 'Channel' },
      { icon: 'tune', label: 'Miscilanious' },
    ],
    [],
  )

  const normalizedQuery = searchValue.replace(/\s/g, '').toLowerCase()

  const onToggleSlideout = () => setSlideoutVisible((v) => !v)

  const onColumnLeftScroll = (e) => {
    setColumnLeftScrollTop(e.currentTarget.scrollTop)
  }

  const onContentMainScroll = (e) => {
    setContentMainScrollTop(e.currentTarget.scrollTop)
  }

  const focusSearch = () => {
    settingsSearchRef.current?.focus()
  }

  const onSearchKeyUp = (e) => {
    const key = e.keyCode || e.which

    if (key === 13) {
      // Enter
      settingsSearchRef.current?.blur()
      setSearchFocused(false)
    } else if (key === 27) {
      // Esc
      settingsSearchRef.current?.blur()
      setSearchFocused(false)
    }

    // Match original behavior: always scroll both panels to top after keyup
    animateScrollTop(columnLeftRef.current, 0, 150)
    animateScrollTop(contentMainRef.current, 0, 150)
  }

  const onNavItemClick = (index) => {
    setActiveNavIndex(index)
    // In the original jQuery implementation, clicking a nav item logged its data-scrollto
    // attribute to the console. We omit that debug-only behavior here to keep the
    // production bundle clean while preserving all visible UI behavior.
  }

  const registerToggleRef = useCallback((id) => (element) => {
    if (element) {
      toggleInputRefs.current[id] = element
      return
    }

    delete toggleInputRefs.current[id]
  }, [])

  const triggerToggleById = useCallback((id) => {
    const input = toggleInputRefs.current[id]
    if (input) {
      input.click()
    }
  }, [])

  return (
    <>
      <div id="titlebar" className={`titlebar ${titlebarActive ? 'active' : ''}`}>
        <div id="logoBox" className="titlebar-box titlebar-left">
          <div
            id="titlebarMenu"
            className="titlebar-item titlebar-left-item titlebar-menu"
            onClick={onToggleSlideout}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onToggleSlideout()
            }}
          >
            <i className="material-icons" aria-hidden="true">
              menu
            </i>
          </div>
          <div 
            id="titlebarLogo" 
            className="titlebar-item titlebar-left-item titlebar-logo"
            onClick={() => navigate('/')}
            role="button"
            aria-label="Go to home"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') navigate('/')
            }}
            style={{ cursor: 'pointer' }}
          >
            <img
              className="titlebar-logo-image"
              src="resources/logo-octopus.jpg"
              alt=""
              aria-hidden="true"
            />
            <span className="titlebar-logo-text">Logo</span>
          </div>
        </div>
        <div id="accountBox" className="titlebar-box titlebar-right">
          <div id="titlebarSubs" className="titlebar-item titlebar-right-item titlebar-subs">
            304
            <i className="material-icons" aria-hidden="true">
              wc
            </i>
          </div>
          <div id="titlebarProfile" className="titlebar-item titlebar-right-item titlebar-profile">
            Username
            <i className="material-icons" aria-hidden="true">
              account_circle
            </i>
          </div>
        </div>
      </div>

      <div id="slideout" className={`slideout ${slideoutHiddenClass ? 'hidden' : ''}`}>
        <nav className="slideout-account" aria-label="Account options">
          <button className="slideout-entry" role="menuitem">
            View Profile
            <i className="material-icons" aria-hidden="true">account_circle</i>
          </button>
          <button className="slideout-entry" role="menuitem">
            Sign Out
            <i className="material-icons" aria-hidden="true">exit_to_app</i>
          </button>
        </nav>

        <nav className="slideout-technical" aria-label="Help and settings">
          <button className="slideout-entry" role="menuitem">
            Frequent Questions
            <i className="material-icons" aria-hidden="true">help</i>
          </button>
          <button className="slideout-entry active" role="menuitem">
            Settings
            <i className="material-icons" aria-hidden="true">settings</i>
          </button>
        </nav>

        <div className="slideout-bottom">
          <ColorPicker onColorChange={(color) => {
            applyThemeColor(color)
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem('themeColor', color)
              }
            } catch {
              // ignore
            }
          }} />
        </div>
      </div>

      <div
        id="shadow"
        className={`shadow ${shadowHiddenClass ? 'hidden' : ''}`}
        style={{ display: shadowDisplay }}
        onClick={onToggleSlideout}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onToggleSlideout()
        }}
      />

      <div id="content" className="content">
        <div className="column-left" id="columnLeft" ref={columnLeftRef} onScroll={onColumnLeftScroll}>
          <div
            className={`column-left-item column-left-search ${settingsSearchParentActive ? 'active' : ''}`}
            id="settingsSearchParent"
            onClick={focusSearch}
            role="searchbox"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') focusSearch()
            }}
            onMouseEnter={(e) => e.stopPropagation()}
            onMouseLeave={(e) => e.stopPropagation()}
          >
            <i className="column-left-item-icon material-icons" aria-hidden="true">
              search
            </i>
            <input
              className="column-left-search-input input"
              id="settingsSearch"
              placeholder="Search settings"
              ref={settingsSearchRef}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyUp={onSearchKeyUp}
            />
          </div>

          {navItems.map((item, i) => (
            <div
              key={item.label}
              className={`column-left-item ${activeNavIndex === i ? 'active' : ''}`}
              onClick={() => onNavItemClick(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onNavItemClick(i)
              }}
            >
              <i className="column-left-item-icon material-icons" aria-hidden="true">
                {item.icon}
              </i>
              <div className="column-left-item-label" data-scrollto={item.dataScrollto}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <div className="content-main" id="contentMain" ref={contentMainRef} onScroll={onContentMainScroll}>
          {sections.map((section, sectionIndex) => {
            const sectionText = `${section.title} ${section.items.join(' ')}`.replace(/\s/g, '').toLowerCase()
            const sectionHidden = normalizedQuery !== '' && !sectionText.includes(normalizedQuery)

            return (
              <div key={`${section.id}-${sectionIndex}`} className={`section-wrap ${sectionHidden ? 'hidden' : ''}`} id={section.id}>
                <div className="section-title">{section.title}</div>
                <div className="section">
                  {section.items.map((label, itemIndex) => {
                    const itemText = `${section.title} ${label}`.replace(/\s/g, '').toLowerCase()
                    const itemActive = normalizedQuery !== '' && itemText.includes(normalizedQuery)
                    const toggleId = `filler-${sectionIndex}-${itemIndex}`

                    return (
                      <div key={`${section.id}-${itemIndex}`} className={`section-item ${itemActive ? 'active' : ''}`}>
                        <div
                          className="section-item-label"
                          onClick={() => triggerToggleById(toggleId)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              triggerToggleById(toggleId)
                            }
                          }}
                        >
                          {label}
                        </div>
                        <div className="section-item-option">
                          <div className="signup-toggle-parent button-toggle-parent">
                            <input
                              id={toggleId}
                              type="checkbox"
                              defaultChecked
                              className="button-toggle"
                              ref={registerToggleRef(toggleId)}
                            />
                            <label htmlFor={toggleId} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="column-right" id="columnRight" />
      </div>
    </>
  )
}


