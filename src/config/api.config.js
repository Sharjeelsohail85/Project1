// API Configuration for Laravel Backend
// Backend location: M:\Video-master

function stripTrailingSlashes(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function resolveApiBaseURL() {
  const configuredBaseURL = stripTrailingSlashes(import.meta.env.VITE_API_BASE_URL)

  if (!configuredBaseURL) {
    return import.meta.env.DEV ? '/api/v1' : 'http://localhost:8000/api/v1'
  }

  if (!import.meta.env.DEV) {
    return configuredBaseURL
  }

  try {
    const parsedURL = new URL(configuredBaseURL)
    const isLocalhostBackend = parsedURL.hostname === 'localhost' || parsedURL.hostname === '127.0.0.1'

    if (isLocalhostBackend) {
      const localPath = stripTrailingSlashes(parsedURL.pathname)
      return localPath || '/api/v1'
    }
  } catch {
    // If configuredBaseURL is already a relative path, keep it as-is.
  }

  return configuredBaseURL
}

const RESOLVED_API_BASE_URL = resolveApiBaseURL()

export const API_CONFIG = {
  // Base URL - Update this to match your Laravel backend URL
  baseURL: RESOLVED_API_BASE_URL,
  
  // API Version
  version: 'v1',
  
  // Timeout for requests (in milliseconds)
  timeout: 30000,
  
  // Endpoints
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      oauthCallback: '/auth/oauth/callback', // For OAuth callbacks
    },
    video: {
      list: '/video',
      show: (id) => `/video/${id}`,
      create: '/video',
      update: (id) => `/video/${id}`,
      delete: (id) => `/video/${id}`,
      my: '/video/me',
      history: '/video/history',
      search: (name, results) => `/video/search/${name}/${results}`,
      like: (id) => `/video/${id}/like`,
      dislike: (id) => `/video/${id}/dislike`,
    },
    channel: {
      list: '/channel',
      show: (id) => `/channel/${id}`,
      create: '/channel',
      update: (id) => `/channel/${id}`,
      delete: (id) => `/channel/${id}`,
      my: '/channel/me',
      subscribe: (id) => `/channel/${id}/subscribe`,
      unsubscribe: (id) => `/channel/${id}/unsubscribe`,
    },
    user: {
      list: '/users',
      show: (id) => `/users/${id}`,
      register: '/users',
      me: '/users/me',
      update: '/users',
      search: (name, results) => `/user/search/${name}/${results}`,
    },
    tag: {
      popular: '/tag',
      user: '/user/tag',
      custom: '/user/tag/custom',
    },
    comment: {
      list: (videoId) => `/video/${videoId}/comment`,
      create: (videoId) => `/video/${videoId}/comment`,
      update: (videoId, commentId) => `/video/${videoId}/comment/${commentId}`,
      delete: (videoId, commentId) => `/video/${videoId}/comment/${commentId}`,
    },
  },
}

// Helper to get auth tokens from localStorage
export function getAuthTokens() {
  if (typeof window !== 'undefined') {
    return {
      token: localStorage.getItem('token'),
      client_id: localStorage.getItem('client_id'),
    }
  }
  return { token: null, client_id: null }
}

// Helper to save auth tokens
export function saveAuthTokens(token, clientId) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token)
    localStorage.setItem('client_id', clientId)
  }
}

// Helper to clear auth tokens
export function clearAuthTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    localStorage.removeItem('client_id')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_provider')
    localStorage.removeItem('user_info')
  }
}

// Helper to build authenticated request URL
export function buildAuthUrl(endpoint) {
  const { token, client_id } = getAuthTokens()
  if (!token || !client_id) return endpoint
  
  const separator = endpoint.includes('?') ? '&' : '?'
  return `${endpoint}${separator}token=${encodeURIComponent(token)}&client_id=${encodeURIComponent(client_id)}`
}
