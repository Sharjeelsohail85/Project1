import { memo, useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { loginWithOAuth } from '../services/auth.service'
import { authAPI } from '../services/api.service'
import styles from '../styles/Login.module.css'

const Login = memo(function Login({ active, onHideLogin, onLoginSuccess }) {
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const isMountedRef = useRef(false)

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

    if (active) {
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
    }
  }, [active, mounted])

  // Handle OAuth login
  const handleOAuthLogin = useCallback(async (provider) => {
    setLoading(true)
    setError(null)
    
    try {
      await loginWithOAuth(provider)

      if (!isMountedRef.current) return
      setLoading(false)
      onLoginSuccess?.()
    } catch (err) {
      if (!isMountedRef.current) return
      setError(err.message || `Failed to sign in with ${provider}. Please try again.`)
      setLoading(false)
    }
  }, [onLoginSuccess])

  const handlePasswordLogin = useCallback(async () => {
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await authAPI.login(email, password)

      if (!isMountedRef.current) return

      if (response?.data?.token) {
        onLoginSuccess?.()
      } else {
        setError('Login failed. Please check your credentials.')
      }
    } catch (err) {
      if (!isMountedRef.current) return
      setError(err.message || 'Login failed. Please try again.')
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
              placeholder="Enter your email"
              type="email"
              id="loginEmailInput"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="standard"
              hiddenLabel
              fullWidth
              InputProps={{ disableUnderline: true }}
              inputProps={{ className: styles.passwordInput, 'aria-label': 'Email' }}
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
              InputProps={{ disableUnderline: true }}
              inputProps={{ className: styles.passwordInput, 'aria-label': 'Password' }}
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
        <div className={styles.loginMethods}>
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
      </div>
    </div>
  )

  // CRITICAL: Render modal via portal directly to document.body or modal-root
  // This ensures it's NOT inside any layout containers
  const modalRoot = document.getElementById('modal-root') || document.body
  return createPortal(modalContent, modalRoot)
})

export default Login
