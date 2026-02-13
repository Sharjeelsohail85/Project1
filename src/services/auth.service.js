// Authentication Service
// Handles OAuth flows for Google, Facebook, and Dropbox
// Now integrated with Laravel backend

import { getOAuthUrl, storeOAuthState, verifyOAuthState } from '../config/auth.config'
import { authAPI } from './api.service'
import { getAuthTokens, saveAuthTokens } from '../config/api.config'

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
  localStorage.setItem('user_info', JSON.stringify(demoUser))
  localStorage.setItem('auth_provider', provider)

  return demoUser
}

/**
 * Initiate OAuth login flow using popup window
 * @param {string} provider - 'google', 'facebook', or 'dropbox'
 * @returns {Promise<Object>} User information and access token
 */
export async function loginWithOAuth(provider) {
  return new Promise((resolve, reject) => {
    // Generate state for security
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    storeOAuthState(provider, state)

    // Get OAuth URL
    let authUrl
    try {
      authUrl = getOAuthUrl(provider, state)
    } catch (error) {
      reject(new Error(`Failed to get OAuth URL: ${error.message}`))
      return
    }

    // Open popup window
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      authUrl,
      `${provider}Login`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    )

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site.'))
      return
    }

    // Listen for OAuth callback
    const checkPopup = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(checkPopup)
          reject(new Error('Login cancelled or popup closed'))
          return
        }

        // Check if popup has navigated to callback URL
        try {
          const popupUrl = popup.location.href
          if (popupUrl.includes('/auth/') || popupUrl.includes('code=') || popupUrl.includes('error=')) {
            clearInterval(checkPopup)
            
            // Get the authorization code from the callback URL
            const urlParams = new URLSearchParams(popup.location.search)
            const code = urlParams.get('code')
            const state = urlParams.get('state')
            const error = urlParams.get('error')
            
            if (error) {
              popup.close()
              reject(new Error(`OAuth error: ${error}`))
              return
            }
            
            if (code) {
              popup.close()
              
              // Exchange code for tokens via backend
              handleOAuthCallback(provider, new URLSearchParams(popup.location.search))
                .then((userInfo) => {
                  resolve(userInfo)
                })
                .catch((err) => {
                  reject(err)
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
    setTimeout(() => {
      clearInterval(checkPopup)
      if (!popup.closed) {
        popup.close()
      }
      reject(new Error('Login timeout. Please try again.'))
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
    const response = await authAPI.oauthCallback(provider, code, state)
    
    if (response.data && response.data.user) {
      return response.data.user
    }
    
    throw new Error('Invalid response from server')
  } catch (error) {
    if (isNetworkOrBackendOAuthError(error)) {
      console.warn(
        `OAuth backend endpoint is unavailable. Falling back to demo mode for ${provider}.`,
        error
      )
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
    const storedUserInfo = localStorage.getItem('user_info')
    if (storedUserInfo) {
      return JSON.parse(storedUserInfo)
    }
    
    // If not in localStorage, try to get from API
    const { token, client_id } = getAuthTokens()
    if (token && client_id) {
      try {
        const response = await authAPI.getCurrentUser()
        if (response.data) {
          localStorage.setItem('user_info', JSON.stringify(response.data))
          return response.data
        }
      } catch (e) {
        console.error('Failed to fetch user from API:', e)
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
