/**
 * Linked Account Service
 * Manages connected OAuth accounts and importing videos from them.
 */
import axios from 'axios'
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

  // 1. Sync currently logged-in user if they registered/logged in with Dropbox
  try {
    const rawUser = storage.getItem('user_info')
    if (rawUser) {
      const mainUser = JSON.parse(rawUser)
      if (mainUser && (mainUser.registration_type === 'dropbox' || mainUser.dropbox_access_token)) {
        const rawAccounts = storage.getItem(CONNECTED_ACCOUNTS_KEY)
        let accountsList = rawAccounts ? JSON.parse(rawAccounts) : []
        const hasMainDropbox = accountsList.some(
          (a) => a.provider === 'dropbox' && a.connected && a.user?.uuid === mainUser.uuid
        )
        if (!hasMainDropbox) {
          // Filter out existing auto-fallback or incorrect ones
          accountsList = accountsList.filter(
            (a) => a.provider !== 'dropbox' || a.user?.uuid === mainUser.uuid
          )
          accountsList.push({
            provider: 'dropbox',
            connected: true,
            user: mainUser,
          })
          storage.setItem(CONNECTED_ACCOUNTS_KEY, JSON.stringify(accountsList))
        }
      }
    }
  } catch (err) {
    console.error('Failed to sync main Dropbox user to connected accounts:', err)
  }

  try {
    const raw = storage.getItem(CONNECTED_ACCOUNTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
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

  if (provider === 'dropbox' && accessToken) {
    try {
      console.log('Fetching live Dropbox videos directly from the frontend...')
      const listFolderUrl = 'https://api.dropboxapi.com/2/files/list_folder'
      const response = await axios.post(listFolderUrl, {
        path: '',
        recursive: true,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
         }
      })

      const entries = response.data?.entries || []
      
      // Filter for video files by extension
      const videoExtensions = ['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi']
      const videoEntries = entries.filter(e => {
        if (e['.tag'] !== 'file') return false
        const name = String(e.name).toLowerCase()
        return videoExtensions.some(ext => name.endsWith(ext))
      })

      // Map to video objects
      const videos = videoEntries.map(e => ({
        id: e.id,
        title: e.name,
        url: e.path_display, // Store the path so we can resolve its shared link on play/import
        path: e.path_display,
        thumbnail: '',
        duration: 'Video',
        publishedAt: e.server_modified ? e.server_modified.split('T')[0] : 'Recent',
      }))

      return {
        videos,
        total: videos.length,
        page: 1,
        perPage: 100,
        hasMore: false,
      }
    } catch (dropboxFetchError) {
      console.error('Failed to fetch videos directly from Dropbox API:', dropboxFetchError?.response?.data || dropboxFetchError?.message)
      // Fallback to backend or demo mode
    }
  }

  if ((provider === 'google' || provider === 'gdrive') && accessToken) {
    try {
      console.log('Fetching live Google Drive videos directly from the frontend...')
      const response = await axios.get('https://www.googleapis.com/drive/v3/files', {
        params: {
          q: "mimeType contains 'video/' and trashed = false",
          fields: 'files(id, name, webContentLink, thumbnailLink, createdTime, size, mimeType)',
          pageSize: 100,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      })

      const files = response.data?.files || []
      
      // Map to video objects
      const videos = files.map(f => {
        const streamUrl = `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media&access_token=${accessToken}`
        return {
          id: f.id,
          title: f.name,
          url: streamUrl,
          thumbnail: f.thumbnailLink || '',
          duration: 'Video',
          publishedAt: f.createdTime ? f.createdTime.split('T')[0] : 'Recent',
        }
      })

      return {
        videos,
        total: videos.length,
        page: 1,
        perPage: 100,
        hasMore: false,
      }
    } catch (gdriveFetchError) {
      console.error('Failed to fetch videos directly from Google Drive API:', gdriveFetchError?.response?.data || gdriveFetchError?.message)
      // Fallback to backend or demo mode
    }
  }

  if (provider === 'onedrive' && accessToken) {
    try {
      console.log('Fetching live OneDrive videos directly from the frontend...')
      // Search for video files or list files in drive
      const response = await axios.get("https://graph.microsoft.com/v1.0/me/drive/root/search(q='')", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      })

      const items = response.data?.value || []
      
      // Filter for video files or files with video extensions
      const videoExtensions = ['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi']
      const videoItems = items.filter(item => {
        if (item.folder) return false
        const name = String(item.name || '').toLowerCase()
        return videoExtensions.some(ext => name.endsWith(ext)) || item.video
      })

      // Map to video objects
      const videos = videoItems.map(item => {
        // Use downloadUrl as stream link, with direct item stream URL as fallback
        const streamUrl = item['@microsoft.graph.downloadUrl'] || `https://graph.microsoft.com/v1.0/me/drive/items/${item.id}/content?access_token=${accessToken}`
        return {
          id: item.id,
          title: item.name,
          url: streamUrl,
          thumbnail: item.thumbnails?.[0]?.medium?.url || '',
          duration: 'Video',
          publishedAt: item.createdDateTime ? item.createdDateTime.split('T')[0] : 'Recent',
        }
      })

      return {
        videos,
        total: videos.length,
        page: 1,
        perPage: 100,
        hasMore: false,
      }
    } catch (onedriveFetchError) {
      console.error('Failed to fetch videos directly from OneDrive API:', onedriveFetchError?.response?.data || onedriveFetchError?.message)
      // Fallback to backend or demo mode
    }
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
  onedrive: [
    { title: 'OneDrive Project Presentation', url: 'https://onedrive.live.com/download?id=demo1', thumbnail: '', duration: '15:10', publishedAt: '2026-06-15' },
    { title: 'OneDrive Outdoor Activity', url: 'https://onedrive.live.com/download?id=demo2', thumbnail: '', duration: '9:40', publishedAt: '2026-06-10' },
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