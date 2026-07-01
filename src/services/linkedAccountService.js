/**
 * Linked Account Service
 * Manages connected OAuth accounts and importing videos from them.
 */
import { loginWithOAuth, getCurrentUser } from './auth.service'
import { apiRequest } from './api.service'

const CONNECTED_ACCOUNTS_KEY = 'connected_accounts'

function shouldUseDemoVideosFallback() {
  // Check environment variable first - this controls whether demo mode is allowed
  const envEnabled = String(import.meta.env.VITE_ALLOW_OAUTH_DEMO || '').toLowerCase() === 'true'
  if (!envEnabled) return false
  
  if (import.meta.env.DEV) return true
  if (typeof window === 'undefined') return false

  const hostname = String(window.location?.hostname || '').toLowerCase()
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function getStorageSafe() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

/**
 * Get the list of currently connected accounts from localStorage.
 * Each entry: { provider: string, connected: boolean, user: object|null }
 */
export function getConnectedAccounts() {
  const storage = getStorageSafe()
  if (!storage) return []

  try {
    const raw = storage.getItem(CONNECTED_ACCOUNTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore parse errors
  }

  // Fallback: detect from legacy auth_provider stored during OAuth login
  const legacyProvider = storage.getItem('auth_provider')
  if (legacyProvider) {
    const accounts = [{ provider: legacyProvider, connected: true, user: null }]
    saveConnectedAccounts(accounts)
    return accounts
  }

  return []
}

function saveConnectedAccounts(accounts) {
  const storage = getStorageSafe()
  if (!storage) return
  try {
    storage.setItem(CONNECTED_ACCOUNTS_KEY, JSON.stringify(accounts))
  } catch {
    // ignore
  }
}

/**
 * Connect a new account via OAuth.
 * @param {string} provider - 'google', 'facebook', 'dropbox'
 */
export async function connectAccount(provider) {
  const userInfo = await loginWithOAuth(provider)
  const accounts = getConnectedAccounts()

  // Ensure user info with access tokens is stored for all providers
  const userWithToken = {
    ...userInfo,
    google_access_token: userInfo?.google_access_token || userInfo?.access_token || '',
    google_refresh_token: userInfo?.google_refresh_token || '',
    dropbox_access_token: userInfo?.dropbox_access_token || '',
    facebook_access_token: userInfo?.facebook_access_token || '',
  }

  const existing = accounts.find((a) => a.provider === provider)
  if (existing) {
    existing.connected = true
    existing.user = userWithToken || null
  } else {
    accounts.push({ provider, connected: true, user: userWithToken || null })
  }

  saveConnectedAccounts(accounts)
  return accounts
}

/**
 * Disconnect a linked account.
 * @param {string} provider
 */
export function disconnectAccount(provider) {
  let accounts = getConnectedAccounts()
  accounts = accounts.filter((a) => a.provider !== provider)
  saveConnectedAccounts(accounts)
  return accounts
}

/**
 * Check if a given provider is already connected.
 */
export function isAccountConnected(provider) {
  const accounts = getConnectedAccounts()
  return accounts.some((a) => a.provider === provider && a.connected)
}

/**
 * Fetch videos from a connected platform via the backend API.
 * @param {string} provider - 'google', 'facebook', 'dropbox'
 * @param {Object} options - { page, perPage }
 */
export async function fetchVideosFromAccount(provider, options = {}) {
  const { page = 1, perPage = 20 } = options
  const accounts = getConnectedAccounts()
  const account = accounts.find((a) => a.provider === provider)

  if (!account || !account.connected) {
    throw new Error(`${provider} account is not connected.`)
  }

  // Try backend endpoint first
  try {
    const accessToken = String(
      account?.user?.google_access_token
        || account?.user?.googleAccessToken
        || account?.user?.dropbox_access_token
        || account?.user?.facebook_access_token
        || account?.google_access_token
        || account?.dropbox_access_token
        || account?.facebook_access_token
        || ''
    ).trim()

    // Use correct header based on provider
    let headers = {}
    if (accessToken) {
      if (provider === 'google' || provider === 'gdrive') {
        headers['x-google-access-token'] = accessToken
      } else if (provider === 'dropbox') {
        headers['x-dropbox-access-token'] = accessToken
      } else if (provider === 'facebook') {
        headers['x-facebook-access-token'] = accessToken
      }
    }
    
    const response = await apiRequest(`/api/v1/accounts/${provider}/videos?page=${page}&per_page=${perPage}`, {
      headers,
    })
    
    // Check if response indicates fallback mode (demo data)
    if (response?.fallback_mode === true) {
      throw new Error(`${provider} OAuth is not configured on the server. Videos shown are demo data.`)
    }
    
    return response?.data || { videos: [], total: 0, page, perPage, hasMore: false }
  } catch (error) {
    // In production, show real error. In local dev, show demo data.
    if (shouldUseDemoVideosFallback()) {
      return getDemoVideos(provider, page, perPage)
    }

    throw error
  }
}

/**
 * Import a video from a connected platform into the app.
 * @param {Object} videoData - { sourceType, sourceUrl, title, description, privacy }
 */
export async function importVideo(videoData) {
  // The actual import is handled by the existing upload flow.
  // This service just maps connected-account data to the upload format.
  return {
    sourceType: videoData.sourceType || 'uploadLink',
    sourceUrl: videoData.sourceUrl || '',
    title: videoData.title || '',
    description: videoData.description || '',
  }
}

/* ───────── Demo / dev data generators ───────── */

function getDemoVideos(provider, page, perPage) {
  const all = DEMO_VIDEOS[provider] || []
  const start = (page - 1) * perPage
  const end = start + perPage
  return {
    videos: all.slice(start, end).map((v, i) => ({
      id: `${provider}-${start + i}`,
      title: v.title,
      url: v.url,
      thumbnail: v.thumbnail,
      duration: v.duration,
      publishedAt: v.publishedAt,
    })),
    total: all.length,
    page,
    perPage,
    hasMore: end < all.length,
  }
}

const DEMO_VIDEOS = {
  google: [
    { title: 'My Google Drive Presentation', url: 'https://drive.google.com/file/d/demo1/view', thumbnail: '', duration: '12:34', publishedAt: '2026-05-15' },
    { title: 'Project Demo Recording', url: 'https://drive.google.com/file/d/demo2/view', thumbnail: '', duration: '8:21', publishedAt: '2026-05-10' },
    { title: 'Team Meeting Notes', url: 'https://drive.google.com/file/d/demo3/view', thumbnail: '', duration: '45:00', publishedAt: '2026-04-28' },
  ],
  facebook: [
    { title: 'Live Stream Recording', url: 'https://facebook.com/watch/?v=demo1', thumbnail: '', duration: '1:23:45', publishedAt: '2026-06-01' },
    { title: 'Product Launch Video', url: 'https://facebook.com/watch/?v=demo2', thumbnail: '', duration: '15:30', publishedAt: '2026-05-20' },
  ],
  dropbox: [
    { title: 'Tutorial Screencast', url: 'https://dropbox.com/s/demo1/video.mp4', thumbnail: '', duration: '22:15', publishedAt: '2026-06-05' },
    { title: 'Event Highlights', url: 'https://dropbox.com/s/demo2/video.mp4', thumbnail: '', duration: '5:45', publishedAt: '2026-05-30' },
    { title: 'Course Introduction', url: 'https://dropbox.com/s/demo3/video.mp4', thumbnail: '', duration: '10:00', publishedAt: '2026-05-25' },
    { title: 'Behind the Scenes', url: 'https://dropbox.com/s/demo4/video.mp4', thumbnail: '', duration: '3:20', publishedAt: '2026-05-18' },
  ],
}

export default {
  getConnectedAccounts,
  connectAccount,
  disconnectAccount,
  isAccountConnected,
  fetchVideosFromAccount,
  importVideo,
}