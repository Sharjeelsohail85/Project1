import { memo, useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { loginWithOAuth, isAuthenticated as checkAuth } from '../services/auth.service'
import { authAPI } from '../services/api.service'
import { isOAuthProviderConfigured } from '../config/auth.config'
import styles from '../styles/Login.module.css'

function getLoginErrorMessage(error) {
  const message = String(error?.message || '').toLowerCase()

  if (message.includes('username does not exist')) {
    return 'This username does not exist.'
  }

  if (message.includes('incorrect password')) {
    return 'Incorrect password. Please try again.'
  }

  return error?.message || 'Login failed. Please try again.'
}

const Login = memo(function Login({ active, onHideLogin, onLoginSuccess }) {
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showCredentialsSetup, setShowCredentialsSetup] = useState(false)
  const [customGoogleClientId, setCustomGoogleClientId] = useState(() => {
    try { return localStorage.getItem('custom_google_client_id') || '' } catch { return '' }
  })
  const [customFacebookAppId, setCustomFacebookAppId] = useState(() => {
    try { return localStorage.getItem('custom_facebook_app_id') || '' } catch { return '' }
  })
  const isMountedRef = useRef(false)
  const isGoogleConfigured = isOAuthProviderConfigured('google')
  const isFacebookConfigured = isOAuthProviderConfigured('facebook')
  const isDropboxConfigured = isOAuthProviderConfigured('dropbox')

  // Ensure component is mounted before rendering portal (SSR safety)
  useEffect(() => {
    isMountedRef.current = true
    setMounted(true)
    return () => {
      isMountedRef.current = false
      setMounted(false)
    }
  }, [])

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (!mounted) return

    // Fail-safe cleanup in case a previous modal state left the page locked.
    if (!active) {
      document.body.classList.remove('modal-open')

      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = ''
      }

      if (document.documentElement.style.overflow === 'hidden') {
        document.documentElement.style.overflow = ''
      }

      if (document.body.style.paddingRight) {
        document.body.style.paddingRight = ''
      }

      return
    }

    // Store original values
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    const originalBodyPaddingRight = document.body.style.paddingRight

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    // Lock scrolling on both body and html
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollbarWidth}px`
    document.documentElement.style.overflow = 'hidden'

    // Add class to body to disable pointer events on underlying content
    document.body.classList.add('modal-open')

    return () => {
      // Restore original values on cleanup
      document.body.style.overflow = originalBodyOverflow
      document.body.style.paddingRight = originalBodyPaddingRight
      document.documentElement.style.overflow = originalHtmlOverflow
      document.body.classList.remove('modal-open')
    }
  }, [active, mounted])

  // Handle OAuth login
  const handleOAuthLogin = useCallback(async (provider) => {
    if (!isOAuthProviderConfigured(provider)) {
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1)
      setError(`${providerName} sign-in is not available right now.`)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      await loginWithOAuth(provider)

      if (!isMountedRef.current) return

      if (checkAuth()) {
        setLoading(false)
        onLoginSuccess?.()
        return
      }

      setError('Login completed but auth session was not saved. Please try again.')
      setLoading(false)
    } catch (err) {
      if (!isMountedRef.current) return
      setError(err.message || `Failed to sign in with ${provider}. Please try again.`)
      setLoading(false)
    }
  }, [onLoginSuccess])

  const handlePasswordLogin = useCallback(async () => {
    if (!email || !password) {
      setError('Please enter both username/email and password')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await authAPI.login(email, password)

      if (!isMountedRef.current) return

      if (checkAuth()) {
        onLoginSuccess?.()
      } else {
        setError('Login failed. Please check your credentials.')
      }
    } catch (err) {
      if (!isMountedRef.current) return
      setError(getLoginErrorMessage(err))
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [email, onLoginSuccess, password])

  // Reset error when modal opens/closes
  useEffect(() => {
    if (active) {
      setError(null)
      setLoading(false)
      setEmail('')
      setPassword('')
      setShowPasswordInput(false)
    }
  }, [active])

  // Don't render anything if not mounted or not active
  if (!mounted || !active) {
    return null
  }

  const muiButtonResetSx = {
    minWidth: 0,
    padding: 0,
    textTransform: 'none',
  }

  const modalContent = (
    <div
      className={styles.loginBackdrop}
      onClick={(e) => {
        // Close modal when clicking backdrop (not content)
        if (e.target === e.currentTarget) {
          onHideLogin?.()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
    >
      {/* Close Button */}
      <Button
        id="loginClose"
        className={styles.loginCloseButton}
        onClick={() => onHideLogin?.()}
        aria-label="Close login modal"
        type="button"
        variant="text"
        color="inherit"
        disableElevation
        disableRipple
        sx={muiButtonResetSx}
      >
        <i className="material-icons" aria-hidden="true">close</i>
      </Button>

      {/* Modal Content Container */}
      <div
        className={styles.loginModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <header className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Sign In</h1>
          <p className={styles.loginSubtitle}>Choose a signin method.</p>
          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}
        </header>

        {/* Password Input Section */}
        <div
          id="loginPasswordBox"
          className={`${styles.passwordInputContainer} ${showPasswordInput ? styles.active : ''}`}
        >
          <Button
            className={styles.backButton}
            onClick={() => setShowPasswordInput(false)}
            aria-label="Go back"
            type="button"
            variant="text"
            color="inherit"
            disableElevation
            disableRipple
            sx={muiButtonResetSx}
          >
            <i className="material-icons" aria-hidden="true">arrow_back</i>
          </Button>
          <div className={styles.inputWrapper}>
            <i className={`${styles.inputIcon} material-icons`} aria-hidden="true">email</i>
            <TextField
              placeholder="Enter username or email"
              type="text"
              id="loginEmailInput"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="standard"
              hiddenLabel
              fullWidth
              slotProps={{
                input: { disableUnderline: true },
                htmlInput: { className: styles.passwordInput, 'aria-label': 'Username or email' }
              }}
            />
          </div>
          <div className={styles.inputWrapper}>
            <i className={`${styles.inputIcon} material-icons`} aria-hidden="true">lock</i>
            <TextField
              placeholder="Enter your password"
              type="password"
              id="loginPasswordInput"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="standard"
              hiddenLabel
              fullWidth
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                if (!loading) {
                  handlePasswordLogin()
                }
              }}
              slotProps={{
                input: { disableUnderline: true },
                htmlInput: { className: styles.passwordInput, 'aria-label': 'Password' }
              }}
            />
            <Button
              className={styles.submitButton}
              aria-label="Submit"
              type="button"
              onClick={handlePasswordLogin}
              disabled={loading}
              variant="text"
              color="inherit"
              disableElevation
              disableRipple
              sx={muiButtonResetSx}
            >
              <i className="material-icons" aria-hidden="true">arrow_forward</i>
            </Button>
          </div>
        </div>

        {/* Auth Method Buttons */}
        <div className={`${styles.loginMethods} ${showPasswordInput ? styles.passwordMode : ''}`}>
          <Button
            className={`${styles.authButton} ${showPasswordInput ? styles.hidden : ''}`}
            id="loginPassword"
            onClick={() => setShowPasswordInput(true)}
            aria-label="Sign in with password"
            type="button"
            variant="text"
            color="inherit"
            disableElevation
            disableRipple
            sx={muiButtonResetSx}
          >
            <i className="material-icons" aria-hidden="true">vpn_key</i>
            <span className={styles.authButtonLabel}>Password</span>
          </Button>

          <Button
            className={styles.authButton}
            id="loginGoogle"
            aria-label="Sign in with Google"
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
            variant="text"
            color="inherit"
            disableElevation
            disableRipple
            sx={muiButtonResetSx}
          >
            <i className="zmdi zmdi-google" aria-hidden="true" />
            <span className={styles.authButtonLabel}>
              {loading ? 'Signing in...' : 'Google'}
            </span>
          </Button>

          <Button
            className={styles.authButton}
            id="loginFacebook"
            aria-label="Sign in with Facebook"
            type="button"
            onClick={() => handleOAuthLogin('facebook')}
            disabled={loading}
            variant="text"
            color="inherit"
            disableElevation
            disableRipple
            sx={muiButtonResetSx}
          >
            <i className="zmdi zmdi-facebook" aria-hidden="true" />
            <span className={styles.authButtonLabel}>
              {loading ? 'Signing in...' : 'Facebook'}
            </span>
          </Button>

          <Button
            className={styles.authButton}
            id="loginDropbox"
            aria-label="Sign in with Dropbox"
            type="button"
            onClick={() => handleOAuthLogin('dropbox')}
            disabled={loading}
            variant="text"
            color="inherit"
            disableElevation
            disableRipple
            sx={muiButtonResetSx}
          >
            <i className="zmdi zmdi-dropbox" aria-hidden="true" />
            <span className={styles.authButtonLabel}>
              {loading ? 'Signing in...' : 'Dropbox'}
            </span>
          </Button>
        </div>

        {/* Collapsible Custom Developer Settings */}
        <div style={{
          marginTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '16px',
          width: '100%'
        }}>
          <Button
            onClick={() => setShowCredentialsSetup(prev => !prev)}
            variant="text"
            color="inherit"
            sx={{
              textTransform: 'none',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.7)',
              width: '100%',
              justifyContent: 'space-between',
              padding: '4px 8px'
            }}
          >
            <span>Custom OAuth Settings (Optional)</span>
            <i className="material-icons" style={{ fontSize: '1.2rem' }}>
              {showCredentialsSetup ? 'expand_less' : 'expand_more'}
            </i>
          </Button>

          {showCredentialsSetup && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginTop: '12px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <p style={{ fontSize: '0.75rem', opacity: 0.8, color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 4px' }}>
                Optionally paste your custom Developer credentials below. If blank, clicking Google or Facebook will sign you in instantly via Demo/Mock Mode.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                  Custom Google Client ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. xxxxx.apps.googleusercontent.com"
                  value={customGoogleClientId}
                  onChange={(e) => setCustomGoogleClientId(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '8px 10px',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                  Custom Facebook App ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1234567890"
                  value={customFacebookAppId}
                  onChange={(e) => setCustomFacebookAppId(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '8px 10px',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <Button
                  variant="text"
                  onClick={() => {
                    try {
                      if (customGoogleClientId.trim()) {
                        localStorage.setItem('custom_google_client_id', customGoogleClientId.trim())
                      } else {
                        localStorage.removeItem('custom_google_client_id')
                      }
                      if (customFacebookAppId.trim()) {
                        localStorage.setItem('custom_facebook_app_id', customFacebookAppId.trim())
                      } else {
                        localStorage.removeItem('custom_facebook_app_id')
                      }
                      setError('Custom credentials saved successfully! Try logging in now.')
                      setTimeout(() => setError(null), 4000)
                    } catch (err) {
                      setError('Failed to save credentials: ' + err.message)
                    }
                  }}
                  sx={{
                    flex: 1,
                    textTransform: 'none',
                    color: '#03DAC6',
                    fontSize: '0.75rem',
                    border: '1px solid rgba(3, 218, 198, 0.3)',
                    padding: '4px 10px'
                  }}
                >
                  Save Settings
                </Button>
                {(customGoogleClientId || customFacebookAppId) && (
                  <Button
                    variant="text"
                    onClick={() => {
                      try {
                        localStorage.removeItem('custom_google_client_id')
                        localStorage.removeItem('custom_facebook_app_id')
                        setCustomGoogleClientId('')
                        setCustomFacebookAppId('')
                        setError('Custom OAuth settings cleared. Reverted to default.')
                        setTimeout(() => setError(null), 4000)
                      } catch (err) {
                        setError('Failed to clear: ' + err.message)
                      }
                    }}
                    sx={{
                      textTransform: 'none',
                      color: '#FF0000',
                      fontSize: '0.75rem',
                      border: '1px solid rgba(255, 0, 0, 0.3)',
                      padding: '4px 10px'
                    }}
                  >
                    Clear & Reset
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // CRITICAL: Render modal via portal directly to document.body or modal-root
  // This ensures it's NOT inside any layout containers
  const modalRoot = document.getElementById('modal-root') || document.body
  return createPortal(modalContent, modalRoot)
})

export default Login
