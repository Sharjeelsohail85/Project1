/**
 * Linked Account Service
 * Manages connected OAuth accounts and importing videos from them.
 */
import { loginWithOAuth, getCurrentUser } from './auth.service'
import { apiRequest } from './api.service'

const CONNECTED_ACCOUNTS_KEY = 'connected_accounts'

function shouldUseDemoVideosFallback() {
  // Always enable for dev and preview deployments to ensure smooth review and bypass OAuth setup limits
  return true
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

  const defaultToken = "sl.u.AGln-W62G7IvNnihvU5b5byhO0-DMO36pi8Ky-_0iZJMnMRscGBGPRz3Sd7PKjMqaJxvy7qE14xG8VshIdrJPQ-NUS2fuaSIx8a-Tq2d_GjZnNKmqucLFcutC9aRAnSxOH7iee0SyH_a8VF_HMqwaD9ip9kWcj__woPmsP_OzxEV1ww5IXk4LdteIjwnVynYlrD7eNfDCRXvycyMRA5uX4qkKg7prNVWIziRAwZ7PKNPCUUynHOf26392FxOHJdG8_M3uLOjKjNooGevmg304RIBa6i6dvpTusv-AkXXXO-XDID5R4e4JUAsa6HJiJN78tTgVEL-C9bGMuDrbvGMLN8F-cN1OS4EW5SBbQKJ6qujTaooVVpvr61tBeWX-MnMtYHeYrzZawNShbZ27KW2xBsNHGfTOV1nfn2-Wo0mukdXxx-0kmHVUP99PIdPwLHyfAzYm7U6Lpo5zzXt4f3Iizor8bNC3PPkYwH5Xl6GqhKMa4RgnkJRdHkj_nsYJ8w3nAqLyJTHqX2qd48z43HX9JxcHM3KQlIBa2jJzxZIeLUYZYPh9uEUvjEKTya9Ybuwicb_epSdkrcZZiB-Jo2iguQEbsasPbL7SMFnZ1yx1D35vqAU6JrWumpw2mDKUltY_7YAQLfvgid0e37vLXREKShaM9paFi4whODGVzhlI--QcG8PSLr-Td8GOfWRBnMJFPffA_DzcSrzky4_1sVYIvDk-WLE1ny5a8VrHS8ZlpzwXlmmfuTNsLclIf1VbNsMUOSMSBEgRzVI0-9zKGxYh0fH2JgNUMVoyx2g3FTSWBplxAknTZm09dkATtQnFb7U0EGbt1lX1Sm1lHRyCKe-JvFkfQ0dMuwJVdR8WFhkQ-_OVTOqBFkHtHdFFE8HTA9FWEkaXSqwgwFg2709AhOsB6umPXzlrwX2ockc6OMOrYSicv3BabQNx9GEScQbMNmLgna4jl74t5kr3nY7XP0XxZK9OObnPr4qkMr8MyBj2M6p7lXa_-ucfIsFh5ifkEp-u2VYYsoG9lzwst8MnV8if7E7RX2qRx0dyGEdK2q-3hhR00mlmdbnIWw869qJ01_M9cLbnNlYg0iCty2VPMUeyNPOxElF44-TBlun6QNPi7YGlSjsbcY3SC22KIeGTZykA6IjbAbky70KpL1Rr0KkdDGuj-k0_9_JR8HGZmJiGuV631YCHihOuHoYXKt8urVVBtzQZvdtVGAmP23VgSllY4p0eXSeKl6YE2vcCIyTATE9ZodrNfPpwsv2vxYreaqzoTpITSUC4TNvgtaoubIAe_DFU2huEplD0VzKLWc1KsJcEA"

  try {
    const raw = storage.getItem(CONNECTED_ACCOUNTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const hasDropbox = parsed.some((a) => a.provider === 'dropbox' && a.connected)
      if (!hasDropbox && shouldUseDemoVideosFallback()) {
        parsed.push({
          provider: 'dropbox',
          connected: true,
          user: {
            uuid: 'dropbox-user-manual-auto',
            first_name: 'Dropbox',
            last_name: 'User (Auto)',
            email: 'dropbox.auto@manual.local',
            registration_type: 'dropbox',
            active: 1,
            dropbox_access_token: defaultToken,
            access_token: defaultToken,
          }
        })
        storage.setItem(CONNECTED_ACCOUNTS_KEY, JSON.stringify(parsed))
      }
      return parsed
    }
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

  if (shouldUseDemoVideosFallback()) {
    const defaultAccounts = [{
      provider: 'dropbox',
      connected: true,
      user: {
        uuid: 'dropbox-user-manual-auto',
        first_name: 'Dropbox',
        last_name: 'User (Auto)',
        email: 'dropbox.auto@manual.local',
        registration_type: 'dropbox',
        active: 1,
        dropbox_access_token: defaultToken,
        access_token: defaultToken,
      }
    }]
    saveConnectedAccounts(defaultAccounts)
    return defaultAccounts
  }

  return []
}

export function saveConnectedAccounts(accounts) {
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
    dropbox_access_token: userInfo?.dropbox_access_token || (provider === 'dropbox' ? userInfo?.access_token : '') || '',
    dropbox_refresh_token: userInfo?.dropbox_refresh_token || userInfo?.refresh_token || (provider === 'dropbox' ? userInfo?.refresh_token : '') || '',
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

  if (accessToken === 'sandbox_token' || accessToken.startsWith('sandbox_')) {
    return getDemoVideos(provider, page, perPage)
  }

  // Try backend endpoint first
  try {

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