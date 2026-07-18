import { Fragment, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import GoogleIcon from '@mui/icons-material/Google'
import FacebookIcon from '@mui/icons-material/Facebook'
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined'
import ColorPicker from './ColorPicker'
import InfiniteGridExact from './personalization/InfiniteGridExact'
import Css2Exact from './personalization/Css2Exact'
import MixingExact from './personalization/MixingExact'
import TagsPage from './tags/TagsPage'
import ChannelPage from './ChannelPage'
import { loginWithOAuth, logout } from '../services/auth.service'
import { isOAuthProviderConfigured } from '../config/auth.config'
import logoOctopus from '../../resources/logo-octopus.png'
import useSmoothWheelScroll from '../hooks/useSmoothWheelScroll'
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

export default function SettingsPage({
  isAuthenticated = false,
  personalizationSettings = {},
  onPersonalizationSettingChange = () => {},
  onThemeColorChange = () => {},
  channelPosterText = 'THENEEDLEDROP',
  channelPosterEnabled = false,
  onChannelPosterTextChange = () => {},
  onChannelPosterEnabledChange = () => {},
  isChannelPage = false,
  channelContent = null,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const isSettingsPage = location.pathname === '/settings'
  const isThemeDesignerPage = location.pathname === '/theme-designer'
  const isFaqPage = location.pathname === '/faq'
  const isChannelRoute = location.pathname === '/channel' || Boolean(isChannelPage)
  const columnLeftRef = useRef(null)
  const contentMainRef = useRef(null)
  const settingsSearchRef = useRef(null)
  const toggleInputRefs = useRef({})

  const [slideoutVisible, setSlideoutVisible] = useState(false)
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(false)
  const [shadowDisplay, setShadowDisplay] = useState('none')
  const [shadowHiddenClass, setShadowHiddenClass] = useState(true)
  const [slideoutHiddenClass, setSlideoutHiddenClass] = useState(true)

  const [columnLeftScrollTop, setColumnLeftScrollTop] = useState(0)
  const [contentMainScrollTop, setContentMainScrollTop] = useState(0)
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [activeNavIndex, setActiveNavIndex] = useState(null)
  const [accountFields, setAccountFields] = useState({
    username: '',
    channelName: '',
    passwordRetype: '',
  })
  const [links, setLinks] = useState({
    google: '',
    facebook: '',
    dropbox: '',
  })
  const [providerConnected, setProviderConnected] = useState({
    google: false,
    facebook: false,
    dropbox: false,
  })
  const [providerLoginErrors, setProviderLoginErrors] = useState({
    google: '',
    facebook: '',
    dropbox: '',
  })
  const [providerLoginLoading, setProviderLoginLoading] = useState('')
  const [activeDesignerCategory, setActiveDesignerCategory] = useState('infiniteGridExplorer')
  const [mixingColors, setMixingColors] = useState({
    color1: '#ff5722',
    color2: '#03a9f4',
  })
  const [css2OrangeMode, setCss2OrangeMode] = useState(false)
  const css2Palette = useMemo(
    () => [
      'AliceBlue', 'AntiqueWhite', 'Aqua', 'Aquamarine', 'Azure', 'Beige', 'Bisque', 'Black', 'BlanchedAlmond',
      'Blue', 'BlueViolet', 'Brown', 'BurlyWood', 'CadetBlue', 'Chartreuse', 'Chocolate', 'Coral', 'CornflowerBlue',
      'Cornsilk', 'Crimson', 'Cyan', 'DarkBlue', 'DarkCyan', 'DarkGoldenRod', 'DarkGray', 'DarkGrey', 'DarkGreen',
      'DarkKhaki', 'DarkMagenta', 'DarkOliveGreen', 'DarkOrange', 'DarkOrchid', 'DarkRed', 'DarkSalmon', 'DarkSeaGreen',
      'DarkSlateBlue', 'DarkSlateGray', 'DarkSlateGrey', 'DarkTurquoise', 'DarkViolet', 'DeepPink', 'DeepSkyBlue',
      'DimGray', 'DimGrey', 'DodgerBlue', 'FireBrick', 'FloralWhite', 'ForestGreen', 'Fuchsia', 'Gainsboro',
      'GhostWhite', 'Gold', 'GoldenRod', 'Gray', 'Grey', 'Green', 'GreenYellow', 'HoneyDew', 'HotPink', 'IndianRed',
      'Indigo', 'Ivory', 'Khaki', 'Lavender', 'LavenderBlush', 'LawnGreen', 'LemonChiffon', 'LightBlue', 'LightCoral',
      'LightCyan', 'LightGoldenRodYellow', 'LightGray', 'LightGrey', 'LightGreen', 'LightPink', 'LightSalmon',
      'LightSeaGreen', 'LightSkyBlue', 'LightSlateGray', 'LightSlateGrey', 'LightSteelBlue', 'LightYellow', 'Lime',
      'LimeGreen', 'Linen', 'Magenta', 'Maroon', 'MediumAquaMarine', 'MediumBlue', 'MediumOrchid', 'MediumPurple',
      'MediumSeaGreen', 'MediumSlateBlue', 'MediumSpringGreen', 'MediumTurquoise', 'MediumVioletRed', 'MidnightBlue',
      'MintCream', 'MistyRose', 'Moccasin', 'NavajoWhite', 'Navy', 'OldLace', 'Olive', 'OliveDrab', 'Orange',
      'OrangeRed', 'Orchid', 'PaleGoldenRod', 'PaleGreen', 'PaleTurquoise', 'PaleVioletRed', 'PapayaWhip', 'PeachPuff',
      'Peru', 'Pink', 'Plum', 'PowderBlue', 'Purple', 'RebeccaPurple', 'Red', 'RosyBrown', 'RoyalBlue', 'SaddleBrown',
      'Salmon', 'SandyBrown', 'SeaGreen', 'SeaShell', 'Sienna', 'Silver', 'SkyBlue', 'SlateBlue', 'SlateGray',
      'SlateGrey', 'Snow', 'SpringGreen', 'SteelBlue', 'Tan', 'Teal', 'Thistle', 'Tomato', 'Turquoise', 'Violet',
      'Wheat', 'White', 'WhiteSmoke', 'Yellow', 'YellowGreen'
    ],
    [],
  )
  const gridPalette = useMemo(
    () => [
      '#f0f8ff', '#7fffd4', '#6495ed', '#ff7f50', '#daa520', '#20b2aa', '#9370db', '#00bfff',
      '#ff69b4', '#48d1cc', '#7cfc00', '#dc143c', '#a52a2a', '#ff8c00', '#4169e1', '#2e8b57',
      '#ffd700', '#9932cc', '#5f9ea0', '#d2691e', '#fa8072', '#4682b4', '#00ced1', '#f4a460',
    ],
    [],
  )
  const [css2PaletteOrder, setCss2PaletteOrder] = useState(() => css2Palette)
  const [selectedGridPrism, setSelectedGridPrism] = useState(null)

  useSmoothWheelScroll(columnLeftRef, {
    enabled: true,
    damping: 0.1,
    wheelMultiplier: 1.15,
    maxDelta: 220,
    usePageFallback: false,
  })

  useSmoothWheelScroll(contentMainRef, {
    enabled: true,
    damping: 0.1,
    wheelMultiplier: 1.15,
    maxDelta: 220,
    usePageFallback: false,
  })

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

  // Mirror original script.js slideout timing behavior
  useEffect(() => {
    let t50
    let t150

    const isVisible = isChannelRoute ? leftSidebarVisible : slideoutVisible

    if (isVisible) {
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
  }, [slideoutVisible, leftSidebarVisible, isChannelRoute])

  const titlebarActive = searchFocused || columnLeftScrollTop > 5 || contentMainScrollTop > 5
  const settingsSearchParentActive = searchFocused || columnLeftScrollTop > 5
  const personalizationSettingKeys = useMemo(() => ['infiniteGridExplorer', 'css2', 'mixingItUp'], [])
  const designerCategories = useMemo(
    () => [
      {
        key: 'infiniteGridExplorer',
        label: 'Infinite grid explorer',
        icon: 'grid_view',
        colors: ['#7c4dff', '#00bcd4', '#4caf50', '#ffca28', '#ff7043'],
      },
      {
        key: 'css2',
        label: 'CSS2',
        icon: 'palette',
        colors: ['#ff9800', '#ff5722', '#3f51b5', '#212121', '#f5f5f5'],
      },
      {
        key: 'mixingItUp',
        label: 'Mixing it up',
        icon: 'gradient',
        colors: ['#ff5722', '#03a9f4', '#ab47bc', '#26c6da', '#8bc34a'],
      },
    ],
    [],
  )
  const personalizationItems = useMemo(
    () => designerCategories.map(({ key, label }) => ({ key, label })),
    [designerCategories],
  )
  const THEME_DESIGNER_ROUTE_TARGET = '__theme_designer_route__'

  const linkItems = useMemo(
    () => [
      {
        type: 'link',
        key: 'google',
        provider: 'Google',
        label: 'Google profile link',
        placeholder: 'Paste or link your Youtube profile',
      },
      {
        type: 'link',
        key: 'facebook',
        provider: 'Facebook',
        label: 'Facebook profile link',
        placeholder: 'Paste or link your Facebook profile',
      },
      {
        type: 'link',
        key: 'dropbox',
        provider: 'Dropbox',
        label: 'Dropbox profile link',
        placeholder: 'Paste or link your Dropbox profile',
      },
    ],
    [],
  )

  const providerConfigured = useMemo(
    () => ({
      google: isOAuthProviderConfigured('google'),
      facebook: isOAuthProviderConfigured('facebook'),
      dropbox: isOAuthProviderConfigured('dropbox'),
    }),
    [],
  )

  const renderProviderLoginIcon = useCallback((providerKey) => {
    switch (providerKey) {
      case 'google':
        return <GoogleIcon className="section-link-login-icon" aria-hidden="true" />
      case 'facebook':
        return <FacebookIcon className="section-link-login-icon" aria-hidden="true" />
      case 'dropbox':
        return <CloudOutlinedIcon className="section-link-login-icon" aria-hidden="true" />
      default:
        return <CloudOutlinedIcon className="section-link-login-icon" aria-hidden="true" />
    }
  }, [])

  const settingsSections = useMemo(
    () => [
      {
        id: 'section1',
        title: 'Account',
        items: [
          {
            type: 'accountField',
            key: 'username',
            label: 'Change username',
            placeholder: 'Enter your username',
            inputType: 'text',
            autoComplete: 'username',
          },
          {
            type: 'accountField',
            key: 'channelName',
            label: 'Change channel name',
            placeholder: 'Enter your channel name',
            inputType: 'text',
            autoComplete: 'organization',
          },
          {
            type: 'accountField',
            key: 'passwordRetype',
            label: 'Change password',
            placeholder: 'Enter new password',
            inputType: 'password',
            autoComplete: 'new-password',
          },
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
        items: [],
      },
      {
        id: 'section6',
        title: 'Miscilanious',
        items: [
          'Change a setting that exists in this box',
          'Change a setting that exists in this box',
          'Change a unique setting that exists in this box',
        ],
      },
      {
        id: 'section7',
        title: 'Links',
        items: linkItems,
      },
    ],
    [linkItems],
  )

  const themeDesignerSections = useMemo(
    () => [
      {
        id: 'theme-designer-main',
        title: 'Theme Designer',
        items: personalizationItems,
      },
    ],
    [personalizationItems],
  )

  const channelSections = useMemo(
    () => [
      {
        id: 'channel-main',
        title: 'Channel',
        items: [],
      },
    ],
    [],
  )

  const sections = isChannelRoute
    ? channelSections
    : isThemeDesignerPage
    ? themeDesignerSections
    : settingsSections

  const settingsNavItems = useMemo(
    () => [
      { icon: 'account_circle', label: 'Account', sectionId: 'section1' },
      { icon: 'fingerprint', label: 'Privacy', sectionId: 'section2' },
      { icon: 'loyalty', label: 'Tags', sectionId: 'section3' },
      { icon: 'format_paint', label: 'Personalization', sectionId: THEME_DESIGNER_ROUTE_TARGET },
      { icon: 'tune', label: 'Miscilanious', sectionId: 'section6' },
      { icon: 'link', label: 'Links', sectionId: 'section7' },
    ],
    [THEME_DESIGNER_ROUTE_TARGET],
  )

  const channelNavItems = useMemo(
    () => [
      { icon: 'podcasts', label: 'Channel', sectionId: 'channel-main' },
    ],
    [],
  )

  const navItems = isChannelRoute ? channelNavItems : settingsNavItems

  const normalizedQuery = searchValue.replace(/\s/g, '').toLowerCase()
  const activeDesignerMeta = useMemo(
    () => designerCategories.find((category) => category.key === activeDesignerCategory) || designerCategories[0],
    [activeDesignerCategory, designerCategories],
  )

  const onToggleSlideout = () => {
    if (isChannelRoute) {
      setLeftSidebarVisible((v) => !v)
    } else {
      setSlideoutVisible((v) => !v)
    }
  }

  const openSettingsPanel = useCallback((sectionId) => {
    setSlideoutVisible(false)
    setLeftSidebarVisible(false)

    if (!sectionId) {
      return
    }

    if (sectionId === THEME_DESIGNER_ROUTE_TARGET) {
      navigate('/theme-designer')
      return
    }

    if (isThemeDesignerPage) {
      navigate(`/settings?section=${encodeURIComponent(sectionId)}`)
      return
    }

    const sectionIndex = sections.findIndex((section) => section.id === sectionId)
    if (sectionIndex >= 0) {
      setActiveNavIndex(sectionIndex)
    }

    const container = contentMainRef.current
    const target = container?.querySelector(`#${sectionId}`)
    if (container && target) {
      animateScrollTop(container, target.offsetTop, 180)
    }
  }, [isThemeDesignerPage, navigate, sections, THEME_DESIGNER_ROUTE_TARGET])

  const handleSignOut = useCallback(() => {
    try {
      logout()
    } catch {
      // ignore and still navigate to home
    }

    setSlideoutVisible(false)
    navigate('/')
  }, [navigate])

  useEffect(() => {
    if (isChannelRoute) {
      setActiveNavIndex(0)
      return
    }

    if (isThemeDesignerPage) {
      const personalizationIndex = navItems.findIndex((item) => item.sectionId === THEME_DESIGNER_ROUTE_TARGET)
      if (personalizationIndex >= 0) {
        setActiveNavIndex(personalizationIndex)
      }
      return
    }

    const querySection = new URLSearchParams(location.search).get('section')
    if (!querySection) {
      return
    }

    const sectionIndex = sections.findIndex((section) => section.id === querySection)
    if (sectionIndex >= 0) {
      setActiveNavIndex(sectionIndex)
    }

    const rafId = requestAnimationFrame(() => {
      const container = contentMainRef.current
      const target = container?.querySelector(`#${querySection}`)
      if (container && target) {
        animateScrollTop(container, target.offsetTop, 180)
      }
    })

    return () => cancelAnimationFrame(rafId)
  }, [isChannelRoute, isThemeDesignerPage, location.search, navItems, sections, THEME_DESIGNER_ROUTE_TARGET])

  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return
      }

      const authProvider = String(localStorage.getItem('auth_provider') || '').toLowerCase()
      if (!['google', 'facebook', 'dropbox'].includes(authProvider)) {
        return
      }

      setProviderConnected((prev) => ({
        ...prev,
        [authProvider]: true,
        ...(authProvider === 'google' ? { dropbox: true } : {}),
      }))
    } catch {
      // ignore localStorage access issues
    }
  }, [])

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

  const handleAccountFieldChange = useCallback((fieldKey, value) => {
    setAccountFields((prev) => ({
      ...prev,
      [fieldKey]: value,
    }))
  }, [])

  const onNavItemClick = (index) => {
    const sectionId = navItems[index]?.sectionId
    openSettingsPanel(sectionId)
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

  const handleLinkFieldChange = useCallback((key, value) => {
    setLinks((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const handleChannelPosterTextInputChange = useCallback((e) => {
    onChannelPosterTextChange(e.target.value)
  }, [onChannelPosterTextChange])

  const handleChannelPosterEnabledToggleChange = useCallback((e) => {
    onChannelPosterEnabledChange(e.target.checked)
  }, [onChannelPosterEnabledChange])

  const handleProviderLogin = useCallback(async (providerKey) => {
    const effectiveProvider = providerKey === 'dropbox' ? 'google' : providerKey

    setProviderLoginErrors((prev) => ({
      ...prev,
      [providerKey]: '',
    }))
    setProviderLoginLoading(providerKey)

    try {
      await loginWithOAuth(effectiveProvider)
      setProviderConnected((prev) => ({
        ...prev,
        [providerKey]: true,
      }))
    } catch (error) {
      setProviderConnected((prev) => ({
        ...prev,
        [providerKey]: false,
      }))
      setProviderLoginErrors((prev) => ({
        ...prev,
        [providerKey]: String(error?.message || 'Login failed. Please try again.'),
      }))
    } finally {
      setProviderLoginLoading('')
    }
  }, [])

  const resolveCssColorToHex = useCallback((colorName) => {
    if (!colorName) {
      return '#673AB7'
    }

    const probe = document.createElement('span')
    probe.style.color = colorName
    probe.style.display = 'none'
    document.body.appendChild(probe)

    const rgb = getComputedStyle(probe).color
    document.body.removeChild(probe)

    const match = rgb.match(/\d+/g)
    if (!match || match.length < 3) {
      return '#673AB7'
    }

    const [r, g, b] = match.slice(0, 3).map((value) => Number(value))
    return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`
  }, [])

  const applyThemeFromColor = useCallback((color) => {
    onThemeColorChange(color)
    applyThemeColor(color)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('themeColor', color)
      }
    } catch {
      // ignore
    }
  }, [onThemeColorChange])

  const handleGridPalettePick = useCallback((color, index) => {
    setSelectedGridPrism({ color, index })
    applyThemeFromColor(color)
  }, [applyThemeFromColor])

  const handleCss2ColorPick = useCallback((colorName) => {
    setCss2PaletteOrder((prev) => {
      const colorIndex = prev.indexOf(colorName)
      if (colorIndex < 0) {
        return prev
      }

      return [
        ...prev.slice(0, colorIndex),
        ...prev.slice(colorIndex + 1),
        colorName,
      ]
    })

    if (colorName === 'Orange') {
      setCss2OrangeMode((prev) => !prev)
    }

    const hex = resolveCssColorToHex(colorName)
    applyThemeFromColor(hex)
  }, [applyThemeFromColor, resolveCssColorToHex])

  const handleCss2OrangeToggle = useCallback(() => {
    setCss2OrangeMode((prev) => !prev)
    applyThemeFromColor('#ff8c00')
  }, [applyThemeFromColor])

  const handleMixingColorChange = useCallback((key, value) => {
    setMixingColors((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const mixedThemeColor = useMemo(() => {
    const hexToRgb = (hex) => {
      const raw = String(hex || '').replace('#', '').padStart(6, '0').slice(0, 6)
      return {
        r: parseInt(raw.slice(0, 2), 16),
        g: parseInt(raw.slice(2, 4), 16),
        b: parseInt(raw.slice(4, 6), 16),
      }
    }

    const rgb1 = hexToRgb(mixingColors.color1)
    const rgb2 = hexToRgb(mixingColors.color2)

    const r = Math.round((rgb1.r + rgb2.r) / 2)
    const g = Math.round((rgb1.g + rgb2.g) / 2)
    const b = Math.round((rgb1.b + rgb2.b) / 2)

    return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`
  }, [mixingColors.color1, mixingColors.color2])

  const handleApplyMixedColor = useCallback(() => {
    applyThemeFromColor(mixedThemeColor)
  }, [applyThemeFromColor, mixedThemeColor])

  const mixingMath = useMemo(() => {
    const rgb1 = {
      r: parseInt(mixingColors.color1.slice(1, 3), 16),
      g: parseInt(mixingColors.color1.slice(3, 5), 16),
      b: parseInt(mixingColors.color1.slice(5, 7), 16),
    }
    const rgb2 = {
      r: parseInt(mixingColors.color2.slice(1, 3), 16),
      g: parseInt(mixingColors.color2.slice(3, 5), 16),
      b: parseInt(mixingColors.color2.slice(5, 7), 16),
    }

    return {
      rgb1,
      rgb2,
      mixed: {
        r: Math.round((rgb1.r + rgb2.r) / 2),
        g: Math.round((rgb1.g + rgb2.g) / 2),
        b: Math.round((rgb1.b + rgb2.b) / 2),
      },
    }
  }, [mixingColors.color1, mixingColors.color2])

  useEffect(() => {
    if (personalizationSettings?.mixingItUp) {
      applyThemeFromColor(mixedThemeColor)
    }
  }, [applyThemeFromColor, mixedThemeColor, personalizationSettings?.mixingItUp])

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
            aria-label="Open menu"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onToggleSlideout()
            }}
          >
            <i className="material-icons" aria-hidden="true">
              menu
            </i>
          </div>
          <Box
            id="titlebarLogo" 
            className="titlebar-item titlebar-left-item titlebar-logo"
            onClick={() => navigate('/')}
            role="button"
            aria-label="Go to home"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate('/')
              }
            }}
            sx={{
              cursor: 'pointer',
              transform: 'translateY(-28px)',
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
        <nav className="slideout-technical" aria-label="Menu options">
          {isAuthenticated ? (
            <button className={`slideout-entry ${isChannelRoute ? 'active' : ''}`} role="menuitem" onClick={() => navigate('/channel')}>
              Channel
              <i className="material-icons" aria-hidden="true">podcasts</i>
            </button>
          ) : null}
          {isAuthenticated ? (
            <button className={`slideout-entry ${isSettingsPage ? 'active' : ''}`} role="menuitem" onClick={() => navigate('/settings')}>
              Settings
              <i className="material-icons" aria-hidden="true">settings</i>
            </button>
          ) : null}
          <button className={`slideout-entry ${isFaqPage ? 'active' : ''}`} role="menuitem" onClick={() => navigate('/faq')}>
            Frequently Asked Questions
            <i className="material-icons" aria-hidden="true">help</i>
          </button>
          <button className={`slideout-entry ${isThemeDesignerPage ? 'active' : ''}`} role="menuitem" onClick={() => navigate('/theme-designer')}>
            Theme Designer
            <i className="material-icons" aria-hidden="true">format_paint</i>
          </button>
          {isAuthenticated ? (
            <button className="slideout-entry" role="menuitem" onClick={handleSignOut}>
              Log Out
              <i className="material-icons" aria-hidden="true">exit_to_app</i>
            </button>
          ) : (
            <>
              <button className="slideout-entry" role="menuitem" onClick={() => navigate('/')}>
                Sign Up
                <i className="material-icons" aria-hidden="true">person_add</i>
              </button>
              <button className="slideout-entry" role="menuitem" onClick={() => navigate('/')}>
                Log In
                <i className="material-icons" aria-hidden="true">exit_to_app</i>
              </button>
            </>
          )}
        </nav>

        <div className="slideout-bottom">
          <ColorPicker onColorChange={(color) => applyThemeFromColor(color)} />
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
        <div 
          className={`column-left ${isChannelRoute ? 'channel-slideout-bar' : ''} ${isChannelRoute && leftSidebarVisible ? 'open' : ''}`} 
          id="columnLeft" 
          ref={columnLeftRef} 
          onScroll={onColumnLeftScroll}
        >
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
              <div className="column-left-item-label" data-scrollto={item.sectionId}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <div 
          className={`content-main ${isChannelRoute ? 'channel-full-width' : ''}`} 
          id="contentMain" 
          ref={contentMainRef} 
          onScroll={onContentMainScroll}
        >
          {sections.map((section, sectionIndex) => {
            const sectionItemLabels = section.items.map((item) => {
              if (typeof item === 'string') {
                return item
              }

              return [item.provider, item.label].filter(Boolean).join(' ')
            })
            const sectionText = `${section.title} ${sectionItemLabels.join(' ')}`.replace(/\s/g, '').toLowerCase()
            const sectionHidden = normalizedQuery !== '' && !sectionText.includes(normalizedQuery)

            return (
              <div key={`${section.id}-${sectionIndex}`} className={`section-wrap ${sectionHidden ? 'hidden' : ''}`} id={section.id}>
                <div className="section-title">{section.title}</div>
                <div className={`section ${(section.id === 'section4' || section.id === 'theme-designer-main') ? 'section-personalization' : ''} ${section.id === 'theme-designer-main' ? 'section-theme-designer' : ''} ${section.id === 'section7' ? 'section-links' : ''} ${section.id === 'section3' ? 'section-tags' : ''} ${section.id === 'channel-main' ? 'section-channel' : ''}`}>
                  {isThemeDesignerPage && section.id === 'theme-designer-main' && (
                    <>
                      <div className="theme-designer-category-bar" role="tablist" aria-label="Theme designer categories">
                        {designerCategories.map((category) => (
                          <button
                            key={category.key}
                            type="button"
                            role="tab"
                            aria-selected={activeDesignerCategory === category.key}
                            className={`theme-designer-category-item ${activeDesignerCategory === category.key ? 'active' : ''}`}
                            onClick={() => setActiveDesignerCategory(category.key)}
                          >
                            <i className="material-icons" aria-hidden="true">{category.icon}</i>
                            <span>{category.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="theme-designer-preview" aria-live="polite">
                        <div className="theme-designer-preview-title">{activeDesignerMeta?.label} design colors</div>
                        <div className="theme-designer-preview-colors">
                          {(activeDesignerMeta?.colors || []).map((color) => (
                            <button
                              key={`${activeDesignerMeta?.key}-${color}`}
                              type="button"
                              className="theme-designer-color-chip"
                              style={{ backgroundColor: color }}
                              aria-label={`Apply ${color} from ${activeDesignerMeta?.label}`}
                              onClick={() => applyThemeFromColor(color)}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {section.id === 'section7' && (
                    <div className="section-links-note">
                      Add profile links from different sources so videos can be fetched from Google, Facebook, and Dropbox instead of being uploaded directly to this website.
                    </div>
                  )}
                  {section.id === 'section3' && (
                    <div className="section-tags-embed">
                      <TagsPage embedded inlineFeedback />
                    </div>
                  )}
                  {isChannelRoute && section.id === 'channel-main' && (
                    <>
                      <div className="section-channel-embed">
                        {channelContent || (
                          <ChannelPage
                            embedded
                          />
                        )}
                      </div>
                    </>
                  )}
                  {section.items.map((item, itemIndex) => {
                    const label = typeof item === 'string' ? item : item.label
                    const personalizationKey = typeof item === 'string' ? null : item.key
                    const isAccountField = section.id === 'section1' && typeof item !== 'string' && item.type === 'accountField'
                    const isLinkField = section.id === 'section7' && typeof item !== 'string' && item.type === 'link'
                    const isPersonalizationSection = section.id === 'section4' || section.id === 'theme-designer-main'
                    const isPersonalizationToggle = isPersonalizationSection
                      && Boolean(personalizationKey)
                      && personalizationSettingKeys.includes(personalizationKey)
                    const isDesignerItemVisible = !isThemeDesignerPage
                      || !isPersonalizationToggle
                      || personalizationKey === activeDesignerCategory
                    const isPersonalizationChecked = isPersonalizationToggle
                      ? Boolean(personalizationSettings[personalizationKey])
                      : true
                    const itemText = `${section.title} ${typeof item === 'string' ? '' : item.provider || ''} ${label}`.replace(/\s/g, '').toLowerCase()
                    const itemActive = normalizedQuery !== '' && itemText.includes(normalizedQuery)
                    const toggleId = isLinkField
                      ? null
                      : isPersonalizationToggle
                      ? `personalization-${personalizationKey}`
                      : `filler-${sectionIndex}-${itemIndex}`

                    if (!isDesignerItemVisible) {
                      return null
                    }

                    if (isAccountField) {
                      return (
                        <div key={`${section.id}-${itemIndex}`} className={`section-item section-account-field-item ${itemActive ? 'active' : ''}`}>
                          <div className="section-account-field-label">{item.label}</div>
                          <input
                            type={item.inputType || 'text'}
                            className="section-account-input input"
                            value={accountFields[item.key] || ''}
                            onChange={(e) => handleAccountFieldChange(item.key, e.target.value)}
                            placeholder={item.placeholder || ''}
                            autoComplete={item.autoComplete || 'off'}
                            aria-label={item.label}
                          />
                        </div>
                      )
                    }

                    if (isLinkField) {
                      const loginProviderName = item.provider
                      const isConnected = Boolean(providerConnected[item.key])
                      const isConfigured = Boolean(providerConfigured[item.key])
                      const isLoading = providerLoginLoading === item.key

                      return (
                        <div key={`${section.id}-${itemIndex}`} className={`section-item section-link-item ${itemActive ? 'active' : ''}`}>
                          <div className="section-link-provider">{item.provider}</div>
                          <input
                            type="url"
                            className="section-link-input input"
                            value={links[item.key] || ''}
                            disabled={!isConnected}
                            onChange={(e) => handleLinkFieldChange(item.key, e.target.value)}
                            placeholder={isConnected ? item.placeholder : `Log in with ${loginProviderName} to enable this field`}
                            aria-label={`${item.provider} profile link`}
                          />
                          <div className="section-link-actions">
                            <button
                              type="button"
                              className={`section-link-login ${isConnected ? 'connected' : ''}`}
                              onClick={() => handleProviderLogin(item.key)}
                              disabled={isLoading || !isConfigured}
                              aria-label={`Log in with ${loginProviderName}`}
                            >
                              {renderProviderLoginIcon(item.key)}
                              <span>
                                {!isConfigured
                                  ? `${loginProviderName} unavailable`
                                  : isLoading
                                  ? 'Logging in...'
                                  : isConnected
                                  ? `${loginProviderName} connected`
                                  : `Log in with ${loginProviderName}`}
                              </span>
                            </button>
                            {!isConnected && !providerLoginErrors[item.key] && (
                              <div className="section-link-hint">
                                Log in to your {loginProviderName} account for this link field to work.
                              </div>
                            )}
                            {providerLoginErrors[item.key] && (
                              <div className="section-link-hint section-link-hint-error">
                                {providerLoginErrors[item.key]}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    }

                    return (
                      <Fragment key={`${section.id}-${itemIndex}`}>
                        <div className={`section-item ${itemActive ? 'active' : ''}`}>
                          <div
                            className="section-item-label"
                            onClick={() => {
                              if (toggleId) {
                                triggerToggleById(toggleId)
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                if (toggleId) {
                                  triggerToggleById(toggleId)
                                }
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
                                {...(isPersonalizationToggle
                                  ? { checked: isPersonalizationChecked }
                                  : { defaultChecked: true })}
                                className="button-toggle"
                                ref={registerToggleRef(toggleId)}
                                onChange={(e) => {
                                  if (isPersonalizationToggle && personalizationKey) {
                                    onPersonalizationSettingChange(personalizationKey, e.target.checked)
                                  }
                                }}
                              />
                              <label htmlFor={toggleId} />
                            </div>
                          </div>
                        </div>

                        {isPersonalizationToggle && isThemeDesignerPage && (
                          <div className="theme-designer-item-colors">
                            {(designerCategories.find((category) => category.key === personalizationKey)?.colors || []).map((color) => (
                              <button
                                key={`${personalizationKey}-${color}`}
                                type="button"
                                className="theme-designer-item-color-chip"
                                style={{ backgroundColor: color }}
                                aria-label={`Use ${color} for ${label}`}
                                onClick={() => applyThemeFromColor(color)}
                              />
                            ))}
                          </div>
                        )}

                        {isPersonalizationToggle && isPersonalizationChecked && personalizationKey === 'infiniteGridExplorer' && (
                          <div className="personalization-widget-row">
                            <div className="personalization-widget-title personalization-widget-title-centered">Infinite Grid Explorer (Exact)</div>
                            <InfiniteGridExact onColorChange={applyThemeFromColor} />
                          </div>
                        )}

                        {isPersonalizationToggle && isPersonalizationChecked && personalizationKey === 'css2' && (
                          <div className="personalization-widget-row">
                            <div className="personalization-widget-title">CSS2 (Exact)</div>
                            <Css2Exact onColorChange={applyThemeFromColor} />
                          </div>
                        )}

                        {isPersonalizationToggle && isPersonalizationChecked && personalizationKey === 'mixingItUp' && (
                          <div className="personalization-widget-row">
                            <div className="personalization-widget-title">Mixing it up (Exact)</div>
                            <MixingExact onColorChange={applyThemeFromColor} />
                          </div>
                        )}
                      </Fragment>
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


