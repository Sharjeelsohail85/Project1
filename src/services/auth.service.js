// Authentication Service
// Handles OAuth flows for Google, Facebook, and Dropbox
// Now integrated with Laravel backend

import axios from 'axios'
import { getOAuthRedirectUri, getOAuthUrl, storeOAuthState, verifyOAuthState } from '../config/auth.config'
import { authAPI } from './api.service'
import { getAuthTokens, saveAuthTokens } from '../config/api.config'

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && !!window.localStorage
}

function setLocalStorageItem(key, value) {
  try {
    if (!canUseBrowserStorage()) return
    localStorage.setItem(key, value)
  } catch {
    // no-op in restricted environments
  }
}

function getLocalStorageItem(key) {
  try {
    if (!canUseBrowserStorage()) return null
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function isNetworkOrBackendOAuthError(error) {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('request timeout') ||
    message.includes('expected json response') ||
    message.includes('404')
  )
}

function isProviderNotConfiguredError(error) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('oauth is not configured') || message.includes('set vite_')
}

function isOAuthDemoModeEnabled() {
  const envEnabled = String(import.meta.env.VITE_ALLOW_OAUTH_DEMO || '').toLowerCase() === 'true'

  if (typeof window === 'undefined') {
    return Boolean(import.meta.env.DEV) && envEnabled
  }

  const hostname = String(window.location?.hostname || '').toLowerCase()
  const isLocalRuntime = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'

  if (!envEnabled) return false

  return Boolean(import.meta.env.DEV) || isLocalRuntime
}

function completeOAuthInDemoMode(provider) {
  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1)
  const timestamp = Date.now()

  const demoUser = {
    uuid: `demo-${provider}-${timestamp}`,
    first_name: `${providerName} User`,
    last_name: '',
    email: `${provider}.user.${timestamp}@demo.local`,
    registration_type: provider,
    active: 1,
  }

  // Keep app auth flow functional even when backend OAuth endpoint is not available.
  setLocalStorageItem('user_info', JSON.stringify(demoUser))
  setLocalStorageItem('auth_provider', provider)
  saveAuthTokens(`demo-token-${provider}-${timestamp}`, `demo-client-${provider}-${timestamp}`)

  return demoUser
}

/**
 * Initiate OAuth login flow using popup window
 * @param {string} provider - 'google', 'facebook', or 'dropbox'
 * @returns {Promise<Object>} User information and access token
 */
export async function loginWithOAuth(provider) {
  if (typeof window === 'undefined') {
    throw new Error('OAuth login is only available in browser environment')
  }

  if (isOAuthDemoModeEnabled() && provider !== 'dropbox') {
    return completeOAuthInDemoMode(provider)
  }

  return new Promise((resolve, reject) => {
    let popup = null
    let checkPopup = null
    let timeoutId = null
    let settled = false
    let isAwaitingCallbackCompletion = false

    const cleanup = () => {
      if (checkPopup) {
        clearInterval(checkPopup)
        checkPopup = null
      }

      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    const resolveOnce = (value) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(value)
    }

    const rejectOnce = (error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }

    const closePopupSafe = () => {
      try {
        if (popup && !popup.closed) {
          popup.close()
        }
      } catch {
        // ignore popup close errors
      }
    }

    // Generate state for security
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    storeOAuthState(provider, state)

    // Get OAuth URL
    let authUrl
    try {
      authUrl = getOAuthUrl(provider, state)
    } catch (error) {
      if (import.meta.env.DEV && isProviderNotConfiguredError(error) && isOAuthDemoModeEnabled()) {
        // Keep signup/login usable in local development when OAuth app credentials
        // have not been configured yet.
        resolveOnce(completeOAuthInDemoMode(provider))
        return
      }

      rejectOnce(new Error(`Failed to get OAuth URL: ${error.message}`))
      return
    }

    // Open popup window
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    popup = window.open(
      authUrl,
      `${provider}Login`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    )

    if (!popup) {
      rejectOnce(new Error('Popup blocked. Please allow popups for this site.'))
      return
    }

    // Listen for OAuth callback via postMessage from the callback page
    const messageHandler = (event) => {
      if (event.data?.type === 'oauth-callback' && event.data?.url) {
        try {
          const callbackUrl = new URL(event.data.url)
          const urlParams = new URLSearchParams(callbackUrl.search)
          const code = urlParams.get('code')
          const error = urlParams.get('error')

          if (error) {
            closePopupSafe()
            window.removeEventListener('message', messageHandler)
            rejectOnce(new Error(`OAuth error: ${error}`))
            return
          }

          if (code) {
            isAwaitingCallbackCompletion = true

            if (checkPopup) {
              clearInterval(checkPopup)
              checkPopup = null
            }

            closePopupSafe()
            window.removeEventListener('message', messageHandler)

            // Exchange code for tokens via backend
            handleOAuthCallback(provider, urlParams)
              .then((userInfo) => {
                resolveOnce(userInfo)
              })
              .catch((err) => {
                rejectOnce(err)
              })
          }
        } catch (e) {
          // ignore malformed messages
        }
      }
    }

    window.addEventListener('message', messageHandler)

    // Fallback: also poll popup location in case postMessage doesn't fire
    checkPopup = setInterval(() => {
      try {
        if (popup.closed) {
          if (isAwaitingCallbackCompletion) {
            return
          }

          cleanup()
          window.removeEventListener('message', messageHandler)
          rejectOnce(new Error('Login cancelled or popup closed'))
          return
        }

        // Check if popup has navigated to callback URL (fallback for browsers that block postMessage)
        try {
          const popupUrl = popup.location.href
          if (popupUrl.includes('/auth/') || popupUrl.includes('code=') || popupUrl.includes('error=')) {
            if (checkPopup) {
              clearInterval(checkPopup)
              checkPopup = null
            }

            const callbackUrl = new URL(popupUrl)
            const urlParams = new URLSearchParams(callbackUrl.search)
            const code = urlParams.get('code')
            const error = urlParams.get('error')

            if (error) {
              closePopupSafe()
              window.removeEventListener('message', messageHandler)
              rejectOnce(new Error(`OAuth error: ${error}`))
              return
            }

            if (code) {
              isAwaitingCallbackCompletion = true
              closePopupSafe()
              window.removeEventListener('message', messageHandler)

              handleOAuthCallback(provider, urlParams)
                .then((userInfo) => {
                  resolveOnce(userInfo)
                })
                .catch((err) => {
                  rejectOnce(err)
                })
            }
          }
        } catch (e) {
          // Cross-origin error is expected until popup navigates to callback
        }
      } catch (e) {
        // Cross-origin error is expected during OAuth flow
      }
    }, 100)

    // Timeout after 5 minutes
    timeoutId = setTimeout(() => {
      closePopupSafe()
      rejectOnce(new Error('Login timeout. Please try again.'))
    }, 300000)
  })
}

/**
 * Handle OAuth callback (called from callback page)
 * @param {string} provider - 'google', 'facebook', or 'dropbox'
 * @param {URLSearchParams} params - URL parameters from callback
 */
export async function handleOAuthCallback(provider, params) {
  const code = params.get('code')
  const state = params.get('state')
  const error = params.get('error')

  if (error) {
    throw new Error(`OAuth error: ${error}`)
  }

  if (!code) {
    throw new Error('No authorization code received')
  }

  // Verify state
  if (state && !verifyOAuthState(provider, state)) {
    throw new Error('Invalid state parameter. Possible CSRF attack.')
  }

  // SECURITY WARNING: Dropbox OAuth token exchange should be done on backend only.
  // Client secrets must NEVER be exposed in frontend code.
  // This implementation uses PKCE-like flow but still requires backend for production use.
  if (provider === 'dropbox') {
    try {
      // CRITICAL: Client secret should come from backend only, not localStorage
      // In production, this entire block should call your backend endpoint instead
      let clientId = 'dcuykx3y074l3er' // default
      // REMOVED: Reading client secret from localStorage is a critical security vulnerability
      // const customSecret = localStorage.getItem('custom_dropbox_client_secret')
      
      const redirectUri = getOAuthRedirectUri(provider)

      const params = new URLSearchParams()
      params.append('code', code)
      params.append('grant_type', 'authorization_code')
      params.append('redirect_uri', redirectUri)
      params.append('client_id', clientId)
      // REMOVED: Never send client_secret from frontend
      // if (clientSecret) {
      //   params.append('client_secret', clientSecret)
      // }

      const isDev = canUseWindow() && window.location.hostname === 'localhost'
      if (isDev) {
        console.log('Exchanging Dropbox auth code (DEV MODE)...', { clientId, redirectUri })
      }

      const tokenResponse = await axios.post('https://api.dropboxapi.com/oauth2/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const tokenData = tokenResponse.data
      const accessToken = tokenData.access_token
      const refreshToken = tokenData.refresh_token

      if (!accessToken) {
        throw new Error('No access token returned from Dropbox')
      }

      // Fetch user info from Dropbox
      const userResponse = await axios.post('https://api.dropboxapi.com/2/users/get_current_account', null, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const dAccount = userResponse.data
      const user = {
        uuid: dAccount.account_id || `dropbox-user-${Date.now()}`,
        first_name: dAccount.name?.given_name || 'Dropbox',
        last_name: dAccount.name?.surname || 'User',
        email: dAccount.email || 'dropbox@connected.local',
        registration_type: 'dropbox',
        active: 1,
        dropbox_access_token: accessToken,
        dropbox_refresh_token: refreshToken || '',
        access_token: accessToken,
        refresh_token: refreshToken || '',
      }

      // Store in local storage
      setLocalStorageItem('user_info', JSON.stringify(user))

      // Also update connected_accounts in localStorage!
      const rawAccounts = localStorage.getItem('connected_accounts')
      const accounts = rawAccounts ? JSON.parse(rawAccounts) : []
      const existingIdx = accounts.findIndex(a => a.provider === 'dropbox')
      const newAcc = { provider: 'dropbox', connected: true, user }
      if (existingIdx > -1) {
        accounts[existingIdx] = newAcc
      } else {
        accounts.push(newAcc)
      }
      localStorage.setItem('connected_accounts', JSON.stringify(accounts))

      return user
    } catch (err) {
      const isDev = canUseWindow() && window.location.hostname === 'localhost'
      if (isDev) {
        console.error('Dropbox frontend exchange failed:', err?.message)
      }
      throw new Error(`Failed to complete Dropbox authentication: ${err?.response?.data?.error_description || err?.message}`)
    }
  }

  try {
    const redirectUri = getOAuthRedirectUri(provider)
    const response = await authAPI.oauthCallback(provider, code, state, redirectUri)

    const directUser = response?.data?.user
    const nestedUser = response?.data?.data?.user
    const fallbackUser = response?.user

    if (directUser || nestedUser || fallbackUser) {
      const user = directUser || nestedUser || fallbackUser
      const googleAccessToken = response?.google_access_token
        || response?.data?.google_access_token
        || response?.data?.data?.google_access_token
        || response?.access_token
        || response?.data?.access_token
        || response?.data?.data?.access_token
        || ''
      const googleRefreshToken = response?.google_refresh_token
        || response?.data?.google_refresh_token
        || response?.data?.data?.google_refresh_token
        || response?.refresh_token
        || response?.data?.refresh_token
        || response?.data?.data?.refresh_token
        || ''

      if (user && typeof user === 'object') {
        if (googleAccessToken && !user.google_access_token) user.google_access_token = googleAccessToken
        if (googleRefreshToken && !user.google_refresh_token) user.google_refresh_token = googleRefreshToken
        setLocalStorageItem('user_info', JSON.stringify(user))
      }

      return user
    }
    
    throw new Error('Invalid response from server')
  } catch (error) {
    if (isNetworkOrBackendOAuthError(error) && isOAuthDemoModeEnabled() && provider !== 'dropbox') {
      return completeOAuthInDemoMode(provider)
    }

    throw new Error(`Failed to complete authentication: ${error.message}`)
  }
}

/**
 * Get current user info from localStorage or API
 */
export async function getCurrentUser() {
  try {
    // First check localStorage
    const storedUserInfo = getLocalStorageItem('user_info')
    if (storedUserInfo) {
      return JSON.parse(storedUserInfo)
    }
    
    // If not in localStorage, try to get from API
    const { token, client_id } = getAuthTokens()
    if (token && client_id) {
      try {
        const response = await authAPI.getCurrentUser()
        if (response.data) {
          setLocalStorageItem('user_info', JSON.stringify(response.data))
          return response.data
        }
      } catch {
        // ignore and fall through to null
      }
    }
    
    return null
  } catch (e) {
    return null
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  const { token, client_id } = getAuthTokens()
  return !!(token && client_id)
}

/**
 * Logout user
 */
export function logout() {
  authAPI.logout()
}
