// API Service for Laravel Backend Integration
// Handles all HTTP requests to the backend API

import { API_CONFIG, getAuthTokens, saveAuthTokens, clearAuthTokens, buildAuthUrl } from '../config/api.config'

function canUseWindow() {
  return typeof window !== 'undefined'
}

function normalizeEndpoint(endpoint) {
  if (!endpoint) {
    return '/'
  }

  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`
}

function buildRequestUrl(endpoint) {
  const normalizedEndpoint = normalizeEndpoint(endpoint)
  const { token, client_id } = getAuthTokens()
  const authEndpoint = token && client_id ? buildAuthUrl(normalizedEndpoint) : normalizedEndpoint

  return `${API_CONFIG.baseURL}${authEndpoint}`
}

function setStorageItemSafe(key, value) {
  if (!canUseWindow()) return

  try {
    window.localStorage.setItem(key, value)
  } catch {
    // no-op in restricted environments
  }
}

function emitAuthLogout() {
  if (!canUseWindow()) return
  window.dispatchEvent(new CustomEvent('auth:logout'))
}

function tryParseJsonFromText(value) {
  if (typeof value !== 'string') return null

  const trimmedValue = value.trim()
  if (!trimmedValue) return null

  try {
    return JSON.parse(trimmedValue)
  } catch {
    return null
  }
}

function normalizeAuthIdentifierToEmail(value) {
  const trimmedValue = String(value || '').trim()

  if (!trimmedValue) {
    return ''
  }

  if (trimmedValue.includes('@')) {
    return trimmedValue.toLowerCase()
  }

  const normalizedLocalPart = trimmedValue
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')

  return `${normalizedLocalPart || 'user'}@example.com`
}

function detectClientOS() {
  if (!canUseWindow() || typeof navigator === 'undefined') return 'web'

  const userAgent = String(navigator.userAgent || '').toLowerCase()

  if (userAgent.includes('windows')) return 'windows'
  if (userAgent.includes('mac os') || userAgent.includes('macintosh')) return 'macos'
  if (userAgent.includes('android')) return 'android'
  if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ios')) return 'ios'
  if (userAgent.includes('linux')) return 'linux'

  return 'web'
}

function getLoginClientMetadata() {
  if (!canUseWindow() || typeof navigator === 'undefined') {
    return {
      client_id: 'web_client',
      device: 'web-browser',
      os: 'web',
    }
  }

  const platform = String(navigator.platform || '').trim()

  return {
    client_id: 'web_client',
    device: platform || 'web-browser',
    os: detectClientOS(),
  }
}

function extractAuthPayload(response) {
  const directData = response?.data
  const nestedData = response?.data?.data
  const source =
    (directData && typeof directData === 'object' && 'token' in directData ? directData : null)
    || (nestedData && typeof nestedData === 'object' && 'token' in nestedData ? nestedData : null)
    || (response && typeof response === 'object' && 'token' in response ? response : null)

  if (!source?.token || !source?.client_id) {
    return null
  }

  return {
    token: source.token,
    client_id: source.client_id,
    user:
      source.user
      || directData?.user
      || nestedData?.user
      || null,
  }
}

/**
 * Main API request function
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Object>} API response
 */
export async function apiRequest(endpoint, options = {}) {
  const { token, client_id } = getAuthTokens()
  const hasActiveAuthSession = Boolean(token && client_id)

  const fullUrl = buildRequestUrl(endpoint)
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'token': token }),
      ...(client_id && { 'client_id': client_id }),
      ...options.headers,
    },
  }

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    console.log(`[API Request] ${config.method || 'GET'} ${fullUrl}`)
    console.log(`[API Request] Headers:`, config.headers)
    
    const response = await fetch(fullUrl, {
      ...config,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    // Handle JSON + resilient fallback for text/plain JSON responses
    const contentType = String(response.headers.get('content-type') || '')
    const isJsonResponse = contentType.includes('application/json') || contentType.includes('+json')
    console.log(`[API Response] Status: ${response.status}, Content-Type: ${contentType}`)

    let data = null
    let responseText = ''

    if (isJsonResponse) {
      try {
        data = await response.json()
      } catch {
        responseText = await response.text()
        data = tryParseJsonFromText(responseText)
      }
    } else {
      responseText = await response.text()
      data = tryParseJsonFromText(responseText)
    }

    if (!data) {
      if (!response.ok) {
        const isHtml = responseText.includes('<!DOCTYPE') || responseText.includes('<html')
        if (isHtml) {
          throw new Error(`Server returned HTML page (likely 404 or error). Status: ${response.status}`)
        }

        const proxyOrConnectionError = /proxy error|econnrefused|failed to connect|connect error/i.test(responseText)
        if (proxyOrConnectionError || response.status >= 500) {
          throw new Error('Failed to fetch. Backend server may be offline. Start Laravel and try again.')
        }

        throw new Error(`Request failed with status ${response.status}`)
      }

      throw new Error(`Expected JSON response, got ${contentType || 'unknown content type'}`)
    }

    console.log(`[API Response] Data:`, data)
    
    // Handle authentication errors only when we have an active session.
    // This prevents guest/public flows (like onboarding tags) from being
    // redirected to home when backend returns 401 for protected actions.
    if (data.status === 401 || data.error === 401) {
      if (hasActiveAuthSession) {
        console.warn(`[API Auth] Authentication failed, clearing tokens`)
        clearAuthTokens()
        emitAuthLogout()
      }
    }
    
    // Handle other errors
    if (data.status && data.status >= 400) {
      const errorMessage = data.error_description?.[0] || data.message || 'An error occurred'
      console.error(`[API Error] ${data.status}: ${errorMessage}`)
      throw new Error(errorMessage)
    }
    
    return data
  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      console.error(`[API Error] Request timeout`)
      throw new Error('Request timeout. Please try again.')
    }

    if (error instanceof TypeError) {
      console.error(`[API Error] Network request failed`, {
        baseURL: API_CONFIG.baseURL,
        endpoint,
        message: error.message,
      })
      throw new Error('Failed to fetch. Backend server may be offline. Start Laravel and try again.')
    }

    if (error?.message) {
      console.error(`[API Error] ${error.message}`)
      throw error
    }

    console.error(`[API Error] Network error`)
    throw new Error('Network error. Please check your connection.')
  }
}

/**
 * Authentication API methods
 */
export const authAPI = {
  /**
   * Login with username/email and password
   * @param {string} identifier
   * @param {string} password
   * @returns {Promise<Object>} Login response with token and client_id
   */
  async login(identifier, password) {
    const loginMetadata = getLoginClientMetadata()
    const normalizedEmail = normalizeAuthIdentifierToEmail(identifier)

    const response = await apiRequest(API_CONFIG.endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          email: normalizedEmail,
          password,
          client_id: loginMetadata.client_id,
          device: loginMetadata.device,
          os: loginMetadata.os,
        },
      }),
    })
    
    const authPayload = extractAuthPayload(response)
    if (authPayload) {
      saveAuthTokens(authPayload.token, authPayload.client_id)

      // Also store user info if available
      if (authPayload.user) {
        setStorageItemSafe('user_info', JSON.stringify(authPayload.user))
      }
    }
    
    return response
  },
  
  /**
   * Register new user
   * @param {Object} userData - { name, email, password, password_confirmation }
   * @returns {Promise<Object>} Registration response
   */
  async register(userData) {
    const fullName = String(userData?.name || '').trim()
    const [firstNamePart, ...lastNameParts] = fullName.split(/\s+/).filter(Boolean)
    const first_name = String(userData?.first_name || firstNamePart || 'User').trim()
    const last_name = String(userData?.last_name || lastNameParts.join(' ') || 'User').trim()
    const phone = String(userData?.phone || '0000000000').trim()

    const response = await apiRequest(API_CONFIG.endpoints.auth.register, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          first_name,
          last_name,
          phone,
          email: normalizeAuthIdentifierToEmail(userData?.email),
          password: userData?.password,
        },
      }),
    })
    
    const authPayload = extractAuthPayload(response)
    if (authPayload) {
      saveAuthTokens(authPayload.token, authPayload.client_id)

      if (authPayload.user) {
        setStorageItemSafe('user_info', JSON.stringify(authPayload.user))
      }
    }

    return response
  },
  
  /**
   * Handle OAuth callback
   * @param {string} provider - 'google', 'facebook', or 'dropbox'
   * @param {string} code - Authorization code from OAuth provider
   * @param {string} state - CSRF state token
   * @param {string} redirectUri - Redirect URI used in the OAuth authorize step
   * @returns {Promise<Object>} OAuth response with token and user info
   */
  async oauthCallback(provider, code, state, redirectUri) {
    const response = await apiRequest(API_CONFIG.endpoints.auth.oauthCallback, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          provider,
          code,
          state,
          redirect_uri: String(redirectUri || '').trim(),
        },
      }),
    })
    
    const authPayload = extractAuthPayload(response)
    if (authPayload) {
      saveAuthTokens(authPayload.token, authPayload.client_id)

      if (authPayload.user) {
        setStorageItemSafe('user_info', JSON.stringify(authPayload.user))
      }

      setStorageItemSafe('auth_provider', provider)
    }
    
    return response
  },
  
  /**
   * Get current user info
   * @returns {Promise<Object>} User information
   */
  async getCurrentUser() {
    return apiRequest(API_CONFIG.endpoints.user.me)
  },
  
  /**
   * Logout (clear tokens)
   */
  logout() {
    clearAuthTokens()
    emitAuthLogout()
  },
}

/**
 * User API methods
 */
export const userAPI = {
  me() {
    return apiRequest(API_CONFIG.endpoints.user.me)
  },

  update(userData) {
    return apiRequest(API_CONFIG.endpoints.user.update, {
      method: 'PUT',
      body: JSON.stringify({ data: userData }),
    })
  },
}

/**
 * Tag API methods
 */
export const tagAPI = {
  popular() {
    return apiRequest(API_CONFIG.endpoints.tag.popular)
  },

  userTags() {
    return apiRequest(API_CONFIG.endpoints.tag.user)
  },

  addUserTag(tagId) {
    return apiRequest(API_CONFIG.endpoints.tag.user, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          tag_id: tagId,
        },
      }),
    })
  },

  addCustomTag(name) {
    return apiRequest(API_CONFIG.endpoints.tag.custom, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          name,
        },
      }),
    })
  },

  removeUserTag(tagId) {
    return apiRequest(`${API_CONFIG.endpoints.tag.user}/${encodeURIComponent(tagId)}`, {
      method: 'DELETE',
    })
  },
}

/**
 * Video API methods
 */
export const videoAPI = {
  list() {
    return apiRequest(API_CONFIG.endpoints.video.list)
  },
  
  show(id) {
    return apiRequest(API_CONFIG.endpoints.video.show(id))
  },
  
  create(videoData) {
    return apiRequest(API_CONFIG.endpoints.video.create, {
      method: 'POST',
      body: JSON.stringify({ data: videoData }),
    })
  },
  
  update(id, videoData) {
    return apiRequest(API_CONFIG.endpoints.video.update(id), {
      method: 'PUT',
      body: JSON.stringify({ data: videoData }),
    })
  },
  
  delete(id) {
    return apiRequest(API_CONFIG.endpoints.video.delete(id), {
      method: 'DELETE',
    })
  },
  
  my() {
    return apiRequest(API_CONFIG.endpoints.video.my)
  },
  
  history() {
    return apiRequest(API_CONFIG.endpoints.video.history)
  },
  
  search(name, results = 10) {
    return apiRequest(API_CONFIG.endpoints.video.search(name, results))
  },
  
  like(id) {
    return apiRequest(API_CONFIG.endpoints.video.like(id))
  },
  
  dislike(id) {
    return apiRequest(API_CONFIG.endpoints.video.dislike(id))
  },

  streamUrl(id) {
    return apiRequest(API_CONFIG.endpoints.video.streamUrl(id))
  },
}

/**
 * Channel API methods
 */
export const channelAPI = {
  list() {
    return apiRequest(API_CONFIG.endpoints.channel.list)
  },
  
  show(id) {
    return apiRequest(API_CONFIG.endpoints.channel.show(id))
  },
  
  create(channelData) {
    return apiRequest(API_CONFIG.endpoints.channel.create, {
      method: 'POST',
      body: JSON.stringify({ data: channelData }),
    })
  },
  
  update(id, channelData) {
    return apiRequest(API_CONFIG.endpoints.channel.update(id), {
      method: 'PUT',
      body: JSON.stringify({ data: channelData }),
    })
  },
  
  delete(id) {
    return apiRequest(API_CONFIG.endpoints.channel.delete(id), {
      method: 'DELETE',
    })
  },
  
  my() {
    return apiRequest(API_CONFIG.endpoints.channel.my)
  },
  
  subscribe(id) {
    return apiRequest(API_CONFIG.endpoints.channel.subscribe(id))
  },
  
  unsubscribe(id) {
    return apiRequest(API_CONFIG.endpoints.channel.unsubscribe(id))
  },
}

/**
 * Comment API methods
 */
export const commentAPI = {
  list(videoId) {
    return apiRequest(API_CONFIG.endpoints.comment.list(videoId))
  },
  
  create(videoId, commentData) {
    return apiRequest(API_CONFIG.endpoints.comment.create(videoId), {
      method: 'POST',
      body: JSON.stringify({ data: commentData }),
    })
  },
  
  update(videoId, commentId, commentData) {
    return apiRequest(API_CONFIG.endpoints.comment.update(videoId, commentId), {
      method: 'PUT',
      body: JSON.stringify({ data: commentData }),
    })
  },
  
  delete(videoId, commentId) {
    return apiRequest(API_CONFIG.endpoints.comment.delete(videoId, commentId), {
      method: 'DELETE',
    })
  },
}

// Export default API service
export default {
  request: apiRequest,
  auth: authAPI,
  user: userAPI,
  tag: tagAPI,
  video: videoAPI,
  channel: channelAPI,
  comment: commentAPI,
}
