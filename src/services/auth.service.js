// Authentication Service
// Handles OAuth flows for Google, Facebook, and Dropbox
// Now integrated with Laravel backend

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
  return String(import.meta.env.VITE_ALLOW_OAUTH_DEMO || '').toLowerCase() === 'true'
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
  saveAuthTokens(`demo-token-${provider}-${timestamp}`, `demo-client-${provider}-${timestamp}`)
  setLocalStorageItem('user_info', JSON.stringify(demoUser))
  setLocalStorageItem('auth_provider', provider)

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

    // Listen for OAuth callback
    checkPopup = setInterval(() => {
      try {
        if (popup.closed) {
          if (isAwaitingCallbackCompletion) {
            return
          }

          rejectOnce(new Error('Login cancelled or popup closed'))
          return
        }

        // Check if popup has navigated to callback URL
        try {
          const popupUrl = popup.location.href
          if (popupUrl.includes('/auth/') || popupUrl.includes('code=') || popupUrl.includes('error=')) {
            // Get the authorization code from the callback URL
            const callbackUrl = new URL(popupUrl)
            const urlParams = new URLSearchParams(callbackUrl.search)
            const code = urlParams.get('code')
            const error = urlParams.get('error')
            
            if (error) {
              closePopupSafe()
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
              
              // Exchange code for tokens via backend
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
          // This is normal during OAuth flow - continue checking
        }
      } catch (e) {
        // Cross-origin error is expected until popup navigates to callback
        // This is normal during OAuth flow
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

  // Exchange code for tokens via Laravel backend API
  try {
    const redirectUri = getOAuthRedirectUri(provider)
    const response = await authAPI.oauthCallback(provider, code, state, redirectUri)
    
    if (response.data && response.data.user) {
      return response.data.user
    }
    
    throw new Error('Invalid response from server')
  } catch (error) {
    if (isNetworkOrBackendOAuthError(error) && isOAuthDemoModeEnabled()) {
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
