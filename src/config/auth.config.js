// OAuth Configuration
// Replace these with your actual OAuth credentials from each provider

const FALLBACK_ORIGIN = 'http://localhost:3000'

function getOriginSafe() {
  if (typeof window === 'undefined' || !window.location?.origin) {
    return FALLBACK_ORIGIN
  }

  return window.location.origin
}

function parseUrlSafe(value) {
  try {
    return new URL(String(value || '').trim())
  } catch {
    return null
  }
}

function isLocalhostHost(hostname) {
  const normalized = String(hostname || '').trim().toLowerCase()
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1'
}

function enforceHttpsForPublicOrigin(origin) {
  const parsed = parseUrlSafe(origin)
  if (!parsed) {
    return origin
  }

  if (!isLocalhostHost(parsed.hostname) && parsed.protocol !== 'https:') {
    parsed.protocol = 'https:'
  }

  return parsed.origin
}

function normalizePath(pathname, fallbackPath) {
  const preferredPath = String(pathname || '').trim() || String(fallbackPath || '').trim() || '/'
  return preferredPath.startsWith('/') ? preferredPath : `/${preferredPath}`
}

function buildAbsoluteRedirect(origin, pathname, search = '') {
  const normalizedOrigin = String(origin || '').trim().replace(/\/$/, '')
  const normalizedPath = normalizePath(pathname, '/auth/google/callback')
  const normalizedSearch = String(search || '').trim()
  return `${normalizedOrigin}${normalizedPath}${normalizedSearch}`
}

function resolveRedirectUri(configuredValue, fallbackPath) {
  const runtimeOrigin = enforceHttpsForPublicOrigin(getOriginSafe())
  const configured = String(configuredValue || '').trim()

  if (!configured) {
    return buildAbsoluteRedirect(runtimeOrigin, fallbackPath)
  }

  const configuredUrl = parseUrlSafe(configured)
  if (!configuredUrl) {
    return configured
  }

  const runtimeUrl = parseUrlSafe(runtimeOrigin)
  if (!runtimeUrl) {
    return configured
  }

  const configuredIsLocal = isLocalhostHost(configuredUrl.hostname)
  const runtimeIsLocal = isLocalhostHost(runtimeUrl.hostname)

  if (configuredIsLocal !== runtimeIsLocal) {
    return buildAbsoluteRedirect(runtimeUrl.origin, configuredUrl.pathname || fallbackPath, configuredUrl.search)
  }

  if (!configuredIsLocal && configuredUrl.protocol !== 'https:') {
    return buildAbsoluteRedirect(`https://${configuredUrl.host}`, configuredUrl.pathname || fallbackPath, configuredUrl.search)
  }

  return buildAbsoluteRedirect(configuredUrl.origin, configuredUrl.pathname || fallbackPath, configuredUrl.search)
}

function getSessionStorageSafe() {
  if (typeof window === 'undefined') return null
  return window.sessionStorage || null
}

export const authConfig = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: resolveRedirectUri(import.meta.env.VITE_GOOGLE_REDIRECT_URI, '/auth/google/callback'),
    scope: 'openid profile email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  facebook: {
    appId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
    redirectUri: resolveRedirectUri(import.meta.env.VITE_FACEBOOK_REDIRECT_URI, '/auth/facebook/callback'),
    scope: 'email public_profile',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  },
  dropbox: {
    clientId: import.meta.env.VITE_DROPBOX_CLIENT_ID || 'hczocrkw8l7dl21',
    redirectUri: resolveRedirectUri(import.meta.env.VITE_DROPBOX_REDIRECT_URI, '/auth/dropbox/callback'),
    scope: 'account_info.read files.content.write files.content.read sharing.write sharing.read',
    authUrl: 'https://www.dropbox.com/oauth2/authorize',
  },
}

function isMissingCredential(value) {
  if (!value) return true
  const normalized = String(value).trim().toLowerCase()
  return (
    normalized === '' ||
    normalized.includes('your_google_client_id_here') ||
    normalized.includes('your_facebook_app_id_here') ||
    normalized.includes('your_dropbox_client_id_here')
  )
}

export function isOAuthProviderConfigured(provider) {
  const config = authConfig[provider]
  if (!config) return false

  if (provider === 'facebook') {
    return !isMissingCredential(config.appId)
  }

  if (provider === 'dropbox') {
    try {
      const customId = localStorage.getItem('custom_dropbox_client_id')
      if (customId && customId.trim()) return true
    } catch {
      // ignore
    }
  }

  return !isMissingCredential(config.clientId)
}

export function getOAuthRedirectUri(provider) {
  const config = authConfig[provider]
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`)
  }

  return String(config.redirectUri || '').trim()
}

// Helper to get OAuth URL for each provider
export function getOAuthUrl(provider, state) {
  const config = authConfig[provider]
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`)
  }

  const params = new URLSearchParams()

  if (provider === 'google') {
    if (isMissingCredential(config.clientId)) {
      throw new Error('Google OAuth is not configured. Set VITE_GOOGLE_CLIENT_ID in your .env file.')
    }

    params.append('client_id', config.clientId)
    params.append('redirect_uri', config.redirectUri)
    params.append('response_type', 'code')
    params.append('scope', config.scope)
    params.append('access_type', 'offline')
    params.append('prompt', 'consent')
    if (state) params.append('state', state)
  } else if (provider === 'facebook') {
    if (isMissingCredential(config.appId)) {
      throw new Error('Facebook OAuth is not configured. Set VITE_FACEBOOK_APP_ID in your .env file.')
    }

    params.append('client_id', config.appId)
    params.append('redirect_uri', config.redirectUri)
    params.append('response_type', 'code')
    params.append('scope', config.scope)
    params.append('state', state || generateState())
  } else if (provider === 'dropbox') {
    let clientId = config.clientId
    try {
      const customId = localStorage.getItem('custom_dropbox_client_id')
      if (customId && customId.trim()) {
        clientId = customId.trim()
      }
    } catch {
      // ignore
    }

    if (!clientId || isMissingCredential(clientId)) {
      throw new Error('Dropbox OAuth is not configured. Set VITE_DROPBOX_CLIENT_ID in your .env file, or enter a Custom App Key (Client ID) in the alternative options.')
    }

    params.append('client_id', clientId)
    params.append('redirect_uri', config.redirectUri)
    params.append('response_type', 'code')
    params.append('scope', config.scope)
    params.append('token_access_type', 'offline')
    if (state) params.append('state', state)
  }

  return `${config.authUrl}?${params.toString()}`
}

// Generate a random state for OAuth security
function generateState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Store state in sessionStorage for verification
export function storeOAuthState(provider, state) {
  try {
    const storage = getSessionStorageSafe()
    if (!storage) return
    storage.setItem(`oauth_state_${provider}`, state)
  } catch {
    // ignore storage write failures
  }
}

// Verify OAuth state
export function verifyOAuthState(provider, state) {
  try {
    const storage = getSessionStorageSafe()
    if (!storage) return false

    const stored = storage.getItem(`oauth_state_${provider}`)
    storage.removeItem(`oauth_state_${provider}`)
    return stored === state
  } catch {
    return false
  }
}
