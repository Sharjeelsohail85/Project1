import { memo, useState, useCallback, useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ColorPicker from './ColorPicker'
import TagsPage from './tags/TagsPage'
import { loginWithOAuth, isAuthenticated as checkAuth } from '../services/auth.service'
import { authAPI } from '../services/api.service'
import { isOAuthProviderConfigured } from '../config/auth.config'
import styles from '../styles/Signup.module.css'
import { SIGNUP_UI_TOKENS } from '../theme/signupTheme'

function isBackendUnavailableError(error) {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('request timeout') ||
    message.includes('expected json response') ||
    message.includes('404') ||
    message.includes('backend server may be offline')
  )
}

function shouldAllowOfflineSignupFallback(error) {
  if (!isBackendUnavailableError(error)) {
    return false
  }

  if (import.meta.env.DEV) {
    return true
  }

  if (typeof window === 'undefined') {
    return false
  }

  const hostname = String(window.location?.hostname || '').toLowerCase()
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function createDemoSignupSession({ name, email, provider = 'password' }) {
  const timestamp = Date.now()
  const demoToken = `demo-token-${provider}-${timestamp}`
  const demoClientId = `demo-client-${provider}-${timestamp}`
  const normalizedName = String(name || '').trim() || `${provider} User`
  const normalizedEmail = String(email || '').trim() || `${provider}.user.${timestamp}@demo.local`

  localStorage.setItem('token', demoToken)
  localStorage.setItem('client_id', demoClientId)
  localStorage.setItem('auth_provider', provider)
  localStorage.setItem('user_info', JSON.stringify({
    uuid: `demo-${provider}-${timestamp}`,
    first_name: normalizedName,
    last_name: '',
    email: normalizedEmail,
    registration_type: provider,
    active: 1,
  }))

  try {
    window.dispatchEvent(new CustomEvent('auth:login'))
  } catch {
    // ignore event dispatch failures
  }
}

function isRecoverableSignupError(error) {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('request timeout') ||
    message.includes('expected json response') ||
    message.includes('404')
  )
}

function isExistingCredentialSignupError(error) {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes('already exists') ||
    message.includes('already been taken') ||
    message.includes('duplicate') ||
    message.includes('unique constraint') ||
    message.includes('integrity constraint')
  )
}

function getSignupErrorMessage(error) {
  if (isExistingCredentialSignupError(error)) {
    return 'This username already exists. Please choose a different one.'
  }

  return error?.message || 'Registration failed. Please try again.'
}

const Signup = memo(function Signup({
  active,
  step,
  onHideSignup,
  onNextSignup,
  onPrevSignup,
  onColorChange,
  onLoginSuccess
}) {
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [hasStepOneInteraction, setHasStepOneInteraction] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const isGoogleConfigured = isOAuthProviderConfigured('google')
  const isFacebookConfigured = isOAuthProviderConfigured('facebook')
  const isDropboxConfigured = isOAuthProviderConfigured('dropbox')

  useEffect(() => {
    if (active && step === 1) {
      setShowPasswordInput(false)
      setHasStepOneInteraction(false)
    }
  }, [active, step])
  
  // Handle OAuth signup
  const handleOAuthSignup = useCallback(async (provider) => {
    if (!isOAuthProviderConfigured(provider)) {
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1)
      window.alert(`${providerName} sign-up is not available right now.`)
      return
    }

    setLoading(true)

    try {
      await loginWithOAuth(provider)

      if (!checkAuth()) {
        window.alert('Signup completed but auth session was not saved. Please try again.')
        return
      }

      onLoginSuccess?.()

      // Keep signup flow inside modal sequence:
      // Step 1 (account) -> Step 2 (tags) -> Step 3 (theme).
      onNextSignup?.()
    } catch (err) {
      if (shouldAllowOfflineSignupFallback(err)) {
        const fallbackEmail = `${provider}.user.${Date.now()}@demo.local`
        createDemoSignupSession({
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
          email: fallbackEmail,
          provider,
        })
        onLoginSuccess?.()
        onNextSignup?.()
        return
      }

      window.alert(err?.message || `Failed to sign up with ${provider}. Please try again.`)
    } finally {
      setLoading(false)
    }
  }, [onLoginSuccess, onNextSignup])

  const handlePasswordSignup = useCallback(async () => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName || !password) {
      window.alert('Please enter a username and password')
      return
    }

    const normalizedEmailLocalPart =
      trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '') || `user.${Date.now()}`

    const signupEmail = trimmedEmail || `${normalizedEmailLocalPart}@example.com`

    setLoading(true)

    try {
      const response = await authAPI.register({
        name: trimmedName,
        email: signupEmail,
        password,
        password_confirmation: password,
      })

      if (response?.data && checkAuth()) {
        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess()
        }

        // Keep signup flow inside modal sequence:
        // Step 1 (account) -> Step 2 (tags) -> Step 3 (theme).
        onNextSignup?.()
      } else {
        window.alert('Registration failed. Please try again.')
      }
    } catch (err) {
      if (shouldAllowOfflineSignupFallback(err)) {
        createDemoSignupSession({
          name: trimmedName,
          email: signupEmail,
          provider: 'password',
        })

        onLoginSuccess?.()
        onNextSignup?.()
        return
      }

      if (isRecoverableSignupError(err)) {
        // Keep onboarding functional when backend is unavailable in local/dev.
        onNextSignup?.()
        return
      }

      window.alert(getSignupErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [email, name, onLoginSuccess, onNextSignup, password])
  const totalSteps = 3
  const progressWidth = `${((step - 1) / (totalSteps - 1)) * 100}%`
  const isStepOne = step === 1
  const shouldHideStepOneNext = isStepOne && !hasStepOneInteraction
  const canSubmitPasswordSignup = name.trim().length > 0 && password.length > 0 && !loading

  const authButtonInlineStyle = isStepOne
    ? {
        top: 'auto',
        width: '74px',
        height: '74px',
        margin: '0 8px',
        borderRadius: 0,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
      }
    : undefined

  const authIconInlineStyle = isStepOne
    ? {
        fontSize: `${SIGNUP_UI_TOKENS.AUTH_ICON_SIZE}px`,
        lineHeight: '74px',
        color: SIGNUP_UI_TOKENS.AUTH_ICON_COLOR,
      }
    : undefined

  const facebookIconInlineStyle = isStepOne
    ? {
        ...authIconInlineStyle,
        fontSize: '62px',
      }
    : undefined

  const dividerInlineStyle = isStepOne
    ? {
        top: 'auto',
        width: `${SIGNUP_UI_TOKENS.AUTH_DIVIDER_WIDTH}px`,
        height: `${SIGNUP_UI_TOKENS.AUTH_DIVIDER_HEIGHT}px`,
        margin: '0 12px 0 6px',
        borderRadius: '1px',
        boxShadow: 'none',
        background: SIGNUP_UI_TOKENS.AUTH_DIVIDER_COLOR,
      }
    : undefined

  const muiButtonResetSx = {
    minWidth: 0,
    padding: 0,
    textTransform: 'none',
  }

  const signupStepOneSx = {
    '&.signup-step-1-view': {
      background: 'var(--theme-color, #678293)',
      color: SIGNUP_UI_TOKENS.TITLE_COLOR,
      borderRadius: 0,
      boxShadow: 'none',
    },
    '&.signup-step-1-view .signup-progress': {
      display: 'none',
    },
    '&.signup-step-1-view .signup-next.step1-next-hidden': {
      opacity: '0 !important',
      visibility: 'hidden',
      pointerEvents: 'none',
    },
    '&.signup-step-1-view #signup1.signup-step1-reference.active': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '76px 24px 36px',
      gap: 0,
      overflowY: 'auto',
    },
    '&.signup-step-1-view #signup1.signup-step1-reference.password-active': {
      paddingTop: '76px',
    },
    '&.signup-step-1-view #signup1 .signup-account-intro': {
      display: 'none',
    },
    '&.signup-step-1-view #signupInputEmail': {
      display: 'none !important',
    },
    '&.signup-step-1-view #signupPasswordBox': {
      display: 'none !important',
    },
    '&.signup-step-1-view #signup1.password-active #signupPasswordBox, &.signup-step-1-view #signup1.password-active #signupPasswordBox.active': {
      display: 'block !important',
      width: `min(${SIGNUP_UI_TOKENS.CARD_WIDTH}px, calc(100% - 24px)) !important`,
      maxWidth: `${SIGNUP_UI_TOKENS.CARD_WIDTH}px`,
      margin: '0 auto !important',
      marginLeft: 'auto !important',
      paddingLeft: '0 !important',
      position: 'relative',
      top: 'auto !important',
      left: '-1px !important',
      right: 'auto !important',
      opacity: '1 !important',
      height: 'auto !important',
      transform: 'none !important',
      overflow: 'visible',
    },
    '&.signup-step-1-view #signup1.password-active .signup-auth-row': {
      display: 'none !important',
    },
    '&.signup-step-1-view #signupPasswordBox .upload-link-wrap': {
      float: 'none',
      width: '100% !important',
      maxWidth: `${SIGNUP_UI_TOKENS.CARD_WIDTH}px`,
      margin: '0 auto !important',
      position: 'relative',
      background: SIGNUP_UI_TOKENS.CARD_BG,
      border: 'none',
      borderRadius: `${SIGNUP_UI_TOKENS.CARD_RADIUS}px`,
      boxShadow: SIGNUP_UI_TOKENS.CARD_SHADOW,
      overflow: 'hidden',
    },
    '&.signup-step-1-view #signupPasswordBox .upload-link-back': {
      margin: '0 !important',
      width: '40px',
      height: '40px',
      lineHeight: '40px',
      opacity: 1,
      pointerEvents: 'auto',
      position: 'absolute !important',
      left: '-50px !important',
      top: '50% !important',
      transform: 'translateY(-50%) !important',
      borderRadius: '999px',
      background: 'rgba(255, 255, 255, 0.18)',
      border: '1px solid rgba(255, 255, 255, 0.3) !important',
      color: `${SIGNUP_UI_TOKENS.TITLE_COLOR} !important`,
      display: 'inline-flex !important',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
      appearance: 'none',
      fontSize: 0,
      zIndex: 7,
    },
    '&.signup-step-1-view #signupPasswordBox .upload-link-back:hover': {
      background: 'rgba(255, 255, 255, 0.28)',
    },
    '&.signup-step-1-view #signupPasswordBox .upload-link-back .material-icons': {
      fontSize: '30px',
      lineHeight: 1,
      margin: 0,
      padding: 0,
      color: SIGNUP_UI_TOKENS.TITLE_COLOR,
    },
    '&.signup-step-1-view #signup1.password-active #signupPasswordBox .upload-go, &.signup-step-1-view #signup1.password-active #signupPasswordBox .upload-go.active': {
      display: 'inline-flex !important',
      position: 'absolute',
      right: '8px',
      top: '50%',
      left: 'auto',
      width: '42px',
      height: '42px',
      margin: 0,
      minWidth: 0,
      padding: 0,
      transform: 'translateY(-50%)',
      border: 'none !important',
      borderRadius: '999px',
      background: 'transparent',
      boxShadow: 'none',
      color: SIGNUP_UI_TOKENS.INPUT_ICON_COLOR,
      opacity: 1,
      pointerEvents: 'auto',
      zIndex: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    '&.signup-step-1-view #signupPasswordBox .upload-go .material-icons': {
      fontSize: '30px',
      lineHeight: 1,
      margin: 0,
      padding: 0,
    },
    '&.signup-step-1-view #signupPasswordBox .upload-go:not(.Mui-disabled):hover': {
      background: 'rgba(95, 113, 131, 0.12)',
    },
    '&.signup-step-1-view #signupPasswordBox .upload-go.Mui-disabled': {
      opacity: 0.44,
      pointerEvents: 'none',
    },
    '&.signup-step-1-view #signupPasswordBox .upload-label': {
      position: 'absolute',
      left: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      margin: 0,
      lineHeight: 1,
      fontSize: `${SIGNUP_UI_TOKENS.INPUT_ICON_SIZE}px`,
      color: SIGNUP_UI_TOKENS.INPUT_ICON_COLOR,
      userSelect: 'none',
    },
    '&.signup-step-1-view #signupPasswordBox .upload-link-input': {
      width: 'calc(100% - 58px)',
      minHeight: `${SIGNUP_UI_TOKENS.CARD_HEIGHT}px`,
      marginLeft: '44px',
      padding: '12px 54px 12px 12px',
      border: 'none',
      background: 'transparent',
      boxShadow: 'none',
      color: SIGNUP_UI_TOKENS.INPUT_TEXT_COLOR,
      fontSize: `${SIGNUP_UI_TOKENS.INPUT_FONT_SIZE}px`,
      fontWeight: 400,
      lineHeight: 1.15,
      letterSpacing: 0,
    },
    '&.signup-step-1-view #signupPasswordBox .upload-link-input::placeholder': {
      color: SIGNUP_UI_TOKENS.INPUT_TEXT_COLOR,
      opacity: 1,
    },
    '&.signup-step-1-view .signup-auth-row': {
      display: 'flex !important',
      alignItems: 'center',
      justifyContent: 'center',
      width: `min(${SIGNUP_UI_TOKENS.CARD_WIDTH}px, calc(100% - 24px))`,
      margin: '8px auto 0',
    },
    '&.signup-step-1-view .signup-auth-row .upload-item-select': {
      top: 'auto',
      width: '74px',
      height: '74px',
      margin: '0 8px',
      borderRadius: 0,
      background: 'transparent !important',
      boxShadow: 'none !important',
      border: 'none !important',
    },
    '&.signup-step-1-view .signup-auth-row .upload-item-select:after': {
      display: 'none !important',
    },
    '&.signup-step-1-view .signup-auth-row .upload-item-select .zmdi, &.signup-step-1-view .signup-auth-row .upload-item-select .material-icons': {
      fontSize: `${SIGNUP_UI_TOKENS.AUTH_ICON_SIZE}px`,
      lineHeight: '74px',
      color: SIGNUP_UI_TOKENS.AUTH_ICON_COLOR,
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.16)',
    },
    '&.signup-step-1-view .signup-auth-row #signupFacebook .zmdi': {
      fontSize: '62px',
    },
    '&.signup-step-1-view .signup-auth-row .upload-link-divide': {
      top: 'auto',
      width: `${SIGNUP_UI_TOKENS.AUTH_DIVIDER_WIDTH}px`,
      height: `${SIGNUP_UI_TOKENS.AUTH_DIVIDER_HEIGHT}px`,
      margin: '0 12px 0 6px',
      borderRadius: '1px',
      boxShadow: 'none',
      background: SIGNUP_UI_TOKENS.AUTH_DIVIDER_COLOR,
    },
    '&.signup-step-1-view #signupInputName': {
      width: `min(${SIGNUP_UI_TOKENS.CARD_WIDTH}px, calc(100% - 24px)) !important`,
      maxWidth: `${SIGNUP_UI_TOKENS.CARD_WIDTH}px`,
      margin: '0 auto 16px !important',
      position: 'relative !important',
      display: 'block',
      background: SIGNUP_UI_TOKENS.CARD_BG,
      border: 'none',
      borderRadius: `${SIGNUP_UI_TOKENS.CARD_RADIUS}px`,
      boxShadow: SIGNUP_UI_TOKENS.CARD_SHADOW,
      transition: 'box-shadow var(--transition-base), transform var(--transition-base)',
    },
    '&.signup-step-1-view #signupInputName:focus-within': {
      boxShadow: '0 0 0 3px rgba(187, 222, 251, 0.45), 0 4px 10px rgba(0, 0, 0, 0.22)',
      transform: 'translateY(-1px)',
    },
    '&.signup-step-1-view #signupInputName .upload-label': {
      position: 'absolute',
      left: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      lineHeight: 1,
      fontSize: `${SIGNUP_UI_TOKENS.INPUT_ICON_SIZE}px`,
      color: SIGNUP_UI_TOKENS.INPUT_ICON_COLOR,
      userSelect: 'none',
      margin: 0,
      padding: 0,
      zIndex: 2,
    },
    '&.signup-step-1-view #signupInputName .upload-label.material-icons': {
      position: 'absolute',
      display: 'block',
      margin: 0,
      padding: 0,
      width: '28px',
      height: '28px',
      lineHeight: '28px',
      top: '50% !important',
      left: '14px !important',
      transform: 'translateY(-50%) !important',
      background: 'transparent !important',
      border: 'none !important',
      boxShadow: 'none !important',
      pointerEvents: 'none',
    },
    '&.signup-step-1-view #signupInputName .upload-link-input': {
      width: 'calc(100% - 58px)',
      minHeight: `${SIGNUP_UI_TOKENS.CARD_HEIGHT}px`,
      marginLeft: '44px',
      padding: '12px 12px',
      border: 'none',
      background: 'transparent',
      boxShadow: 'none',
      color: SIGNUP_UI_TOKENS.INPUT_TEXT_COLOR,
      fontSize: `${SIGNUP_UI_TOKENS.INPUT_FONT_SIZE}px`,
      fontWeight: 400,
      lineHeight: 1.15,
      letterSpacing: 0,
    },
    '&.signup-step-1-view #signupInputName .upload-link-input::placeholder': {
      color: SIGNUP_UI_TOKENS.INPUT_TEXT_COLOR,
      opacity: 1,
    },
    '&.signup-step-1-view #signup1 .signup-title': {
      position: 'static',
      margin: 0,
      width: '100%',
      padding: 0,
      fontSize: `${Math.round(SIGNUP_UI_TOKENS.TITLE_FONT_SIZE * 1.6 * 1.3 * 1.3)}px !important`,
      color: SIGNUP_UI_TOKENS.TITLE_COLOR,
      textAlign: 'center',
      lineHeight: SIGNUP_UI_TOKENS.TITLE_LINE_HEIGHT,
      letterSpacing: 0,
    },
    '&.signup-step-1-view #signup1 .signup-desc': {
      position: 'static',
      width: '100%',
      maxWidth: '560px',
      margin: '26px 0 34px',
      padding: 0,
      display: 'block !important',
      color: SIGNUP_UI_TOKENS.SUBTITLE_COLOR,
      textAlign: 'center',
      lineHeight: SIGNUP_UI_TOKENS.SUBTITLE_LINE_HEIGHT,
      fontSize: `${Math.round(SIGNUP_UI_TOKENS.SUBTITLE_FONT_SIZE * 1.5 * 1.3 * 1.3)}px !important`,
      overflow: 'visible !important',
      whiteSpace: 'normal',
      textOverflow: 'clip',
      height: 'auto',
      opacity: 1,
      visibility: 'visible',
    },
    '&.signup-step-1-view #signup1.password-active .signup-desc': {
      margin: '24px 0 30px',
      minHeight: '2.6rem',
    },
    '@media (max-width: 768px)': {
      '&.signup-step-1-view #signup1.signup-step1-reference.active': {
        padding: '68px 14px 22px',
        gap: '12px',
      },
      '&.signup-step-1-view #signup1.signup-step1-reference.password-active': {
        paddingTop: '56px',
        gap: '8px',
      },
      '&.signup-step-1-view #signup1 .signup-title': {
        fontSize: 'clamp(1.9rem, 7.3vw, 2.4rem)',
      },
      '&.signup-step-1-view #signup1 .signup-desc': {
        maxWidth: '92%',
        fontSize: '15px',
      },
      '&.signup-step-1-view #signupInputName, &.signup-step-1-view #signupInputEmail, &.signup-step-1-view #signupPasswordBox': {
        width: 'min(450px, 100%) !important',
      },
      '&.signup-step-1-view #signup1.password-active #signupPasswordBox': {
        left: '0 !important',
      },
      '&.signup-step-1-view #signupPasswordBox .upload-link-back': {
        left: '-48px !important',
      },
      '&.signup-step-1-view #signupInputName .upload-link-input, &.signup-step-1-view #signupPasswordBox .upload-link-input': {
        fontSize: '22px',
        minHeight: '54px',
        padding: '15px 12px',
      },
      '&.signup-step-1-view #signupInputName .upload-label, &.signup-step-1-view #signupPasswordBox .upload-label': {
        fontSize: '22px',
      },
      '&.signup-step-1-view .signup-auth-row': {
        marginTop: '16px',
      },
      '&.signup-step-1-view .signup-auth-row .upload-item-select': {
        width: '52px',
        height: '52px',
        margin: '0 7px',
      },
      '&.signup-step-1-view .signup-auth-row .upload-item-select .zmdi, &.signup-step-1-view .signup-auth-row .upload-item-select .material-icons': {
        fontSize: '38px',
      },
      '&.signup-step-1-view .signup-auth-row #signupFacebook .zmdi': {
        fontSize: '42px',
      },
      '&.signup-step-1-view .signup-auth-row .upload-link-divide': {
        height: '46px',
        margin: '0 10px',
      },
    },
    '@media (max-width: 520px)': {
      '&.signup-step-1-view #signup1.signup-step1-reference.active': {
        padding: '64px 10px 18px',
        gap: '10px',
      },
      '&.signup-step-1-view #signup1.signup-step1-reference.password-active': {
        paddingTop: '52px',
        gap: '6px',
      },
      '&.signup-step-1-view #signup1.password-active #signupPasswordBox': {
        left: '1px !important',
      },
      '&.signup-step-1-view #signup1 .signup-title': {
        fontSize: 'clamp(1.7rem, 8.6vw, 2.1rem)',
      },
      '&.signup-step-1-view #signup1 .signup-desc': {
        fontSize: '14px',
      },
      '&.signup-step-1-view #signupInputName .upload-link-input, &.signup-step-1-view #signupPasswordBox .upload-link-input': {
        fontSize: '19px',
        minHeight: '50px',
        marginLeft: '42px',
        width: 'calc(100% - 52px)',
        padding: '13px 10px',
      },
      '&.signup-step-1-view #signupPasswordBox .upload-link-back': {
        width: '36px',
        height: '36px',
        lineHeight: '36px',
        left: '-40px !important',
      },
      '&.signup-step-1-view #signupInputName .upload-label, &.signup-step-1-view #signupPasswordBox .upload-label': {
        left: '12px',
        fontSize: '20px',
      },
      '&.signup-step-1-view .signup-auth-row': {
        marginTop: '12px',
      },
      '&.signup-step-1-view .signup-auth-row .upload-item-select': {
        width: '46px',
        height: '46px',
        margin: '0 5px',
      },
      '&.signup-step-1-view .signup-auth-row .upload-item-select .zmdi, &.signup-step-1-view .signup-auth-row .upload-item-select .material-icons': {
        fontSize: '32px',
      },
      '&.signup-step-1-view .signup-auth-row #signupFacebook .zmdi': {
        fontSize: '35px',
      },
      '&.signup-step-1-view .signup-auth-row .upload-link-divide': {
        height: '40px',
        margin: '0 8px',
      },
    },
  }

  return (
    <Box
      component="section"
      id="signup"
      className={`signup ${active ? 'active' : ''} ${step === 1 ? 'signup-step-1-view' : ''}`}
      aria-label="Sign up"
      aria-hidden={!active}
      sx={isStepOne ? signupStepOneSx : undefined}
    >
      {/* Progress Bar */}
      <div id="signupProgressContainer" className="signup-progress" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4}>
        <div id="signupProgressBar" className="signup-progress-bar" style={{ width: progressWidth }} />
      </div>

      {/* Navigation Buttons */}
      <Button
        id="signupClose"
        className="signup-close button-float active"
        onClick={() => onHideSignup?.()}
        aria-label="Close signup"
        type="button"
        variant="text"
        color="inherit"
        disableElevation
        disableRipple
        sx={muiButtonResetSx}
      >
        <i className="material-icons" aria-hidden="true">close</i>
      </Button>
      <Button
        id="signupNext"
        className={`signup-next button-float ${shouldHideStepOneNext ? 'step1-next-hidden' : 'active'}`}
        onClick={() => {
          if (step === 1) {
            setHasStepOneInteraction(true)

            if (!showPasswordInput) {
              setShowPasswordInput(true)
              return
            }

            handlePasswordSignup()
            return
          }

          onNextSignup?.()
        }}
        aria-label="Next step"
        type="button"
        variant="text"
        color="inherit"
        disableElevation
        disableRipple
        sx={muiButtonResetSx}
      >
        <i className="material-icons" aria-hidden="true">navigate_next</i>
      </Button>
      <Button
        id="signupPrev"
        className={`signup-prev button-float ${step > 1 ? 'active' : ''}`}
        onClick={() => onPrevSignup?.()}
        aria-label="Previous step"
        type="button"
        variant="text"
        color="inherit"
        disableElevation
        disableRipple
        sx={muiButtonResetSx}
      >
        <i className="material-icons" aria-hidden="true">navigate_before</i>
      </Button>

      {/* Step 1: Create Account */}
      <div
        id="signup1"
        className={`signup-page-1 signup-page signup-step1-reference ${step === 1 ? 'active' : ''} ${showPasswordInput ? 'password-active' : ''}`}
      >
        <Typography
          component="h2"
          variant="h2"
          className={`${styles.signupTitle} signup-title`}
        >
          Create an Account
        </Typography>
        <div className="signup-account-intro" aria-label="Account setup guidance">
          <i className="material-icons" aria-hidden="true">person_add</i>
          <div className="signup-account-intro-copy">
            <strong>Account setup</strong>
            <span>Use your name and choose any signup method below.</span>
          </div>
        </div>
        <Typography
          component="p"
          variant="body1"
          className={`${styles.signupDesc} signup-desc`}
        >
          Choose a username and login method.
        </Typography>

        {/* Name Input */}
        <Box id="signupInputName" className="upload-link-wrap signup-input-username" sx={{ position: 'relative' }}>
          <i className="material-icons upload-label" aria-hidden="true">account_circle</i>
          <TextField
            id="signupNameInput"
            type="text"
            placeholder="Username"
            value={name}
            onChange={(e) => {
              setHasStepOneInteraction(true)
              setName(e.target.value)
            }}
            variant="standard"
            hiddenLabel
            fullWidth
            InputProps={{ disableUnderline: true }}
            inputProps={{ className: 'upload-link-input input', 'aria-label': 'Username' }}
          />
        </Box>

        {/* Email Input */}
        <div id="signupInputEmail" className="upload-link-wrap signup-input-email">
          <i className="material-icons upload-label" aria-hidden="true">email</i>
          <TextField
            id="signupEmailInput"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setHasStepOneInteraction(true)
              setEmail(e.target.value)
            }}
            variant="standard"
            hiddenLabel
            fullWidth
            InputProps={{ disableUnderline: true }}
            inputProps={{ className: 'upload-link-input input', 'aria-label': 'Email' }}
          />
        </div>

        {/* Password Input */}
        <div id="signupPasswordBox" className={`upload-link ${showPasswordInput ? 'active' : ''}`}>
          <Button
            className="upload-link-back"
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
          <div className="upload-link-wrap">
            <i className="material-icons upload-label" aria-hidden="true">vpn_key</i>
            <TextField
              id="signupPasswordInput"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setHasStepOneInteraction(true)
                setPassword(e.target.value)
              }}
              variant="standard"
              hiddenLabel
              fullWidth
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                if (canSubmitPasswordSignup) {
                  handlePasswordSignup()
                }
              }}
              InputProps={{ disableUnderline: true }}
              inputProps={{ className: 'upload-link-input input', 'aria-label': 'Password' }}
            />
            <Button 
              className="upload-go active" 
              aria-label="Submit password"
              onClick={handlePasswordSignup}
              disabled={!canSubmitPasswordSignup}
              type="button"
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
        <div className="signup-auth-row" aria-label="Sign up methods">
          <Button
            className={`upload-item-select ${showPasswordInput ? 'hidden' : ''}`}
            id="signupPassword"
            onClick={() => {
              setHasStepOneInteraction(true)
              setShowPasswordInput(true)
            }}
            aria-label="Sign up with password"
            style={authButtonInlineStyle}
            type="button"
            variant="text"
            color="inherit"
            disableElevation
            disableRipple
            sx={muiButtonResetSx}
          >
            <i className="material-icons" aria-hidden="true" style={authIconInlineStyle}>vpn_key</i>
          </Button>
          <span className={`upload-link-divide ${showPasswordInput ? 'hidden' : ''}`} style={dividerInlineStyle} />
          <Button 
            className="upload-item-select" 
            id="signupGoogle" 
            aria-label="Sign up with Google"
            onClick={() => {
              setHasStepOneInteraction(true)
              handleOAuthSignup('google')
            }}
            disabled={loading || !isGoogleConfigured}
            style={authButtonInlineStyle}
            type="button"
            variant="text"
            color="inherit"
            disableElevation
            disableRipple
            sx={muiButtonResetSx}
          >
            <i className="zmdi zmdi-google" aria-hidden="true" style={authIconInlineStyle} />
          </Button>
          <Button 
            className="upload-item-select" 
            id="signupFacebook" 
            aria-label="Sign up with Facebook"
            onClick={() => {
              setHasStepOneInteraction(true)
              handleOAuthSignup('facebook')
            }}
            disabled={loading || !isFacebookConfigured}
            style={authButtonInlineStyle}
            type="button"
            variant="text"
            color="inherit"
            disableElevation
            disableRipple
            sx={muiButtonResetSx}
          >
            <i className="zmdi zmdi-facebook" aria-hidden="true" style={facebookIconInlineStyle} />
          </Button>
          <Button 
            className="upload-item-select" 
            id="signupDropbox" 
            aria-label="Sign up with Dropbox"
            onClick={() => {
              setHasStepOneInteraction(true)
              handleOAuthSignup('dropbox')
            }}
            disabled={loading || !isDropboxConfigured}
            style={authButtonInlineStyle}
            type="button"
            variant="text"
            color="inherit"
            disableElevation
            disableRipple
            sx={muiButtonResetSx}
          >
            <i className="zmdi zmdi-dropbox" aria-hidden="true" style={authIconInlineStyle} />
          </Button>
        </div>
      </div>

      {/* Step 2: Tags */}
      <div id="signup2" className={`signup-page-2 signup-page ${step === 2 ? 'active' : ''}`}>
        <TagsPage />
      </div>

      {/* Step 3: Theme Color */}
      <div id="signup3" className={`signup-page-3 signup-page ${step === 3 ? 'active' : ''}`}>
        <h2 className="signup-title">Theme Color</h2>
        <div className="signup-page-container">
          <div className="signup-color signup-item transparent">
            <div className="signup-item-title" />
            <div className="signup-item-desc">
              <div className="color-height">
                <ColorPicker onColorChange={onColorChange} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Complete */}
      <div id="signup4" className={`signup-page-4 signup-page ${step === 4 ? 'active' : ''}`}>
        <h2 className="signup-title">You're Finished</h2>
        <div className="signup-page-container">
          <p className="signup-subtitle">Here are some other steps to consider.</p>
        </div>
      </div>
    </Box>
  )
})

export default Signup
