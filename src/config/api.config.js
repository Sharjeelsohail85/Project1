// API Configuration for Laravel Backend
// Backend location: M:\Video-master

function stripTrailingSlashes(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function isDemoTokenValue(value) {
  const token = String(value || '').trim().toLowerCase()
  if (!token) return false
  return token.includes('demo-token') || token.startsWith('oauth-demo-token-')
}

function isLocalhostHost(hostname) {
  const normalized = String(hostname || '').trim().toLowerCase()
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1'
}

function isCloudflareWorkersDevHost(hostname) {
  const normalized = String(hostname || '').trim().toLowerCase()
  return normalized === 'workers.dev' || normalized.endsWith('.workers.dev')
}

function getOriginSafe() {
  if (typeof window === 'undefined' || !window.location?.origin) {
    return ''
  }

  return stripTrailingSlashes(window.location.origin)
}

function isPublicRuntimeHost() {
  const origin = getOriginSafe()
  if (!origin) return false

  try {
    const hostname = new URL(origin).hostname
    if (isCloudflareWorkersDevHost(hostname)) {
      return false
    }

    return !isLocalhostHost(hostname)
  } catch {
    return false
  }
}

function normalizeApiPath(pathname) {
  const path = String(pathname || '').trim()
  if (!path) return '/api/v1'
  return path.startsWith('/') ? stripTrailingSlashes(path) : `/${stripTrailingSlashes(path)}`
}

function buildAbsoluteApiBase(origin, pathname) {
  const normalizedOrigin = stripTrailingSlashes(origin)
  const normalizedPath = normalizeApiPath(pathname)
  return `${normalizedOrigin}${normalizedPath}`
}

function getConfiguredProductionApiOrigin() {
  const fromEnv = stripTrailingSlashes(import.meta.env.VITE_PRODUCTION_API_ORIGIN)
  if (!fromEnv) {
    return ''
  }

  try {
    const parsed = new URL(fromEnv)
    if (isLocalhostHost(parsed.hostname)) {
      return ''
    }

    if (parsed.protocol !== 'https:') {
      return `https://${parsed.host}`
    }

    return stripTrailingSlashes(parsed.origin)
  } catch {
    return ''
  }
}

function resolveApiBaseURL() {
  const runtimeOrigin = getOriginSafe()

  // Production safety: if app is served on octopussol.com, always use same-origin API.
  // This prevents accidental fallback to localhost or old worker/proxy endpoints.
  if (!import.meta.env.DEV && runtimeOrigin) {
    try {
      const runtimeHost = new URL(runtimeOrigin).hostname.toLowerCase()
      if (runtimeHost === 'octopussol.com' || runtimeHost === 'www.octopussol.com') {
        return '/api/v1'
      }
    } catch {
      // ignore parse errors and continue normal resolution
    }
  }

  const productionApiOrigin = getConfiguredProductionApiOrigin()
  if (!import.meta.env.DEV && productionApiOrigin) {
    return buildAbsoluteApiBase(productionApiOrigin, '/api/v1')
  }

  const configuredBaseURL = stripTrailingSlashes(import.meta.env.VITE_API_BASE_URL)

  if (!configuredBaseURL) {
    return '/api/v1'
  }

  if (configuredBaseURL.startsWith('/')) {
    return configuredBaseURL
  }

  try {
    const parsedURL = new URL(configuredBaseURL)
    const isLocalhostBackend = isLocalhostHost(parsedURL.hostname)
    const configuredPath = normalizeApiPath(parsedURL.pathname)

    if (isLocalhostBackend && import.meta.env.DEV) {
      return configuredPath
    }

    if (isLocalhostBackend && !import.meta.env.DEV) {
      if (runtimeOrigin) {
        return buildAbsoluteApiBase(runtimeOrigin, configuredPath)
      }

      return configuredPath
    }

    const secureOrigin = !import.meta.env.DEV && parsedURL.protocol !== 'https:'
      ? `https://${parsedURL.host}`
      : parsedURL.origin

    return buildAbsoluteApiBase(secureOrigin, configuredPath)
  } catch {
    const normalizedMaybePath = normalizeApiPath(configuredBaseURL)
    if (configuredBaseURL.startsWith('/')) {
      return normalizedMaybePath
    }

    return configuredBaseURL
  }
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
      login: '/api/v1/auth/login',
      register: '/api/v1/auth/register',
      oauthCallback: '/api/v1/auth/oauth/callback', // For OAuth callbacks
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
      streamUrl: (id) => `/videos/${id}/stream-url`,
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
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token')
    const storedClientId = localStorage.getItem('client_id') || localStorage.getItem('auth_client_id')

    // Production hardening: stale demo-mode tokens must never be used against live API.
    if (isPublicRuntimeHost() && isDemoTokenValue(token)) {
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('client_id')
        localStorage.removeItem('auth_client_id')
      } catch {
        // ignore storage cleanup errors
      }

      return {
        token: null,
        client_id: null,
      }
    }

    return {
      token,
      client_id: storedClientId || (token ? 'web_client' : null),
    }
  }
  return { token: null, client_id: null }
}

// Helper to save auth tokens
export function saveAuthTokens(token, clientId) {
  if (typeof window !== 'undefined') {
    const normalizedClientId = String(clientId || '').trim() || 'web_client'
    localStorage.setItem('token', token)
    localStorage.setItem('auth_token', token)
    localStorage.setItem('client_id', normalizedClientId)
    localStorage.setItem('auth_client_id', normalizedClientId)

    try {
      window.dispatchEvent(new CustomEvent('auth:login'))
    } catch {
      // ignore event dispatch failures
    }
  }
}

// Helper to clear auth tokens
export function clearAuthTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    localStorage.removeItem('client_id')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_client_id')
    localStorage.removeItem('auth_provider')
    localStorage.removeItem('user_info')
  }
}

// Helper to build authenticated request headers
export function buildAuthHeaders(customHeaders = {}) {
  const { token, client_id } = getAuthTokens()
  const headers = { ...customHeaders }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (client_id) {
    headers['X-Client-ID'] = client_id
  }
  
  return headers
}

// Deprecated: Use buildAuthHeaders instead - tokens in URLs are insecure
export function buildAuthUrl(endpoint) {
  console.warn('[DEPRECATED] buildAuthUrl is deprecated. Use buildAuthHeaders for secure authentication.')
  const { token, client_id } = getAuthTokens()
  if (!token || !client_id) return endpoint
  
  const separator = endpoint.includes('?') ? '&' : '?'
  return `${endpoint}${separator}token=${encodeURIComponent(token)}&client_id=${encodeURIComponent(client_id)}`
}
