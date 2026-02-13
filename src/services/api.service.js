// API Service for Laravel Backend Integration
// Handles all HTTP requests to the backend API

import { API_CONFIG, getAuthTokens, saveAuthTokens, clearAuthTokens, buildAuthUrl } from '../config/api.config'

/**
 * Main API request function
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Object>} API response
 */
export async function apiRequest(endpoint, options = {}) {
  const { token, client_id } = getAuthTokens()
  const url = `${API_CONFIG.baseURL}${endpoint}`
  
  // Build URL with auth params if tokens exist
  const authUrl = token && client_id ? buildAuthUrl(endpoint) : endpoint
  const fullUrl = `${API_CONFIG.baseURL}${authUrl}`
  
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
    const response = await fetch(fullUrl, {
      ...config,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response, got ${contentType}`)
    }
    
    const data = await response.json()
    
    // Handle authentication errors
    if (data.status === 401 || data.error === 401) {
      clearAuthTokens()
      // You can dispatch an event or redirect to login here
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }
    
    // Handle other errors
    if (data.status && data.status >= 400) {
      const errorMessage = data.error_description?.[0] || data.message || 'An error occurred'
      throw new Error(errorMessage)
    }
    
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.')
    }
    
    if (error.message) {
      throw error
    }
    
    console.error('API Request Error:', error)
    throw new Error('Network error. Please check your connection.')
  }
}

/**
 * Authentication API methods
 */
export const authAPI = {
  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} Login response with token and client_id
   */
  async login(email, password) {
    const response = await apiRequest(API_CONFIG.endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          email,
          password,
        },
      }),
    })
    
    if (response.data && response.data.token && response.data.client_id) {
      saveAuthTokens(response.data.token, response.data.client_id)
      
      // Also store user info if available
      if (response.data.user) {
        localStorage.setItem('user_info', JSON.stringify(response.data.user))
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
    const response = await apiRequest(API_CONFIG.endpoints.auth.register, {
      method: 'POST',
      body: JSON.stringify({
        data: userData,
      }),
    })
    
    return response
  },
  
  /**
   * Handle OAuth callback
   * @param {string} provider - 'google', 'facebook', or 'dropbox'
   * @param {string} code - Authorization code from OAuth provider
   * @param {string} state - CSRF state token
   * @returns {Promise<Object>} OAuth response with token and user info
   */
  async oauthCallback(provider, code, state) {
    const response = await apiRequest(API_CONFIG.endpoints.auth.oauthCallback, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          provider,
          code,
          state,
        },
      }),
    })
    
    if (response.data && response.data.token && response.data.client_id) {
      saveAuthTokens(response.data.token, response.data.client_id)
      
      if (response.data.user) {
        localStorage.setItem('user_info', JSON.stringify(response.data.user))
        localStorage.setItem('auth_provider', provider)
      }
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
    window.dispatchEvent(new CustomEvent('auth:logout'))
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
  video: videoAPI,
  channel: channelAPI,
  comment: commentAPI,
}
