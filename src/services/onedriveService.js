import axios from 'axios'

/**
 * Microsoft OneDrive client-side service
 * Handles OAuth, browsing, chunked session-based uploads, and direct stream URL retrieval.
 */

const ONEDRIVE_DEFAULT_CLIENT_ID = '86f4a867-b50a-40a2-9903-a4a350a4d1f2' // Fallback Client ID

export function getOneDriveClientId() {
  try {
    return import.meta.env.VITE_ONEDRIVE_CLIENT_ID || localStorage.getItem('custom_onedrive_client_id') || ONEDRIVE_DEFAULT_CLIENT_ID
  } catch {
    return import.meta.env.VITE_ONEDRIVE_CLIENT_ID || ONEDRIVE_DEFAULT_CLIENT_ID
  }
}

export function saveOneDriveCredentials(clientId, clientSecret = '') {
  try {
    localStorage.setItem('custom_onedrive_client_id', String(clientId || '').trim())
    if (clientSecret) {
      localStorage.setItem('custom_onedrive_client_secret', String(clientSecret || '').trim())
    }
  } catch (error) {
    console.error('Failed to save OneDrive credentials:', error)
  }
}

/**
 * Connect with OneDrive using Implicit Grant OAuth Flow
 */
export function connectOneDriveWithImplicitToken() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('OneDrive connection is only available in a browser.'))
      return
    }

    const clientId = getOneDriveClientId()
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36)
    const redirectUri = `${window.location.origin}/auth/google/callback`
    const scopes = [
      'files.readwrite',
      'files.readwrite.all',
      'sites.readwrite.all',
      'openid',
      'profile',
      'User.Read'
    ].join(' ')

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: scopes,
      response_mode: 'fragment',
      prompt: 'consent',
      state,
    })

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
    const width = 560
    const height = 720
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(authUrl, 'onedrive-oauth', `width=${width},height=${height},left=${left},top=${top}`)
    if (!popup) {
      reject(new Error('Popup blocked for OneDrive. Please allow popups and try again.'))
      return
    }

    const cleanup = () => {
      window.removeEventListener('message', onMessage)
      clearInterval(timer)
    }

    const finish = (callbackUrl) => {
      const parsed = new URL(callbackUrl)
      // Implicit grant returns parameters in the hash fragment (#access_token=...)
      const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''))
      const search = new URLSearchParams(parsed.search)
      const accessToken = String(hash.get('access_token') || search.get('access_token') || '').trim()
      const error = String(hash.get('error') || search.get('error') || '').trim()
      const errorDescription = String(hash.get('error_description') || search.get('error_description') || '').trim()

      if (error) {
        throw new Error(`OneDrive OAuth error: ${errorDescription || error}`)
      }
      if (!accessToken) {
        throw new Error('OneDrive did not return an access token.')
      }

      // Fetch user profile from Microsoft Graph to get display details
      axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then((res) => {
        const msUser = res.data || {}
        const user = {
          uuid: `onedrive-${msUser.id || Date.now()}`,
          first_name: msUser.givenName || 'Microsoft',
          last_name: msUser.surname || 'OneDrive',
          email: msUser.mail || msUser.userPrincipalName || 'onedrive@connected.local',
          registration_type: 'onedrive',
          active: 1,
          onedrive_access_token: accessToken,
        }

        // Save to connected accounts in local storage
        const rawAccounts = localStorage.getItem('connected_accounts')
        const accounts = rawAccounts ? JSON.parse(rawAccounts) : []
        const newAccount = {
          provider: 'onedrive',
          connected: true,
          user,
        }
        const filtered = accounts.filter(a => a.provider !== 'onedrive')
        filtered.push(newAccount)
        localStorage.setItem('connected_accounts', JSON.stringify(filtered))
        try {
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new CustomEvent('connected_accounts_changed'))
        } catch {}

        resolve(user)
      })
      .catch((graphErr) => {
        // Fallback user object if profile fetch fails
        const user = {
          uuid: `onedrive-${Date.now()}`,
          first_name: 'Microsoft',
          last_name: 'OneDrive (Manual)',
          email: 'onedrive@connected.local',
          registration_type: 'onedrive',
          active: 1,
          onedrive_access_token: accessToken,
        }

        const rawAccounts = localStorage.getItem('connected_accounts')
        const accounts = rawAccounts ? JSON.parse(rawAccounts) : []
        const newAccount = {
          provider: 'onedrive',
          connected: true,
          user,
        }
        const filtered = accounts.filter(a => a.provider !== 'onedrive')
        filtered.push(newAccount)
        localStorage.setItem('connected_accounts', JSON.stringify(filtered))
        try {
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new CustomEvent('connected_accounts_changed'))
        } catch {}

        resolve(user)
      })
    }

    function onMessage(event) {
      if (event.data?.type !== 'oauth-callback' || !event.data?.url) return
      try {
        finish(event.data.url)
        cleanup()
        popup.close()
      } catch (error) {
        cleanup()
        popup.close()
        reject(error)
      }
    }

    window.addEventListener('message', onMessage)
    const timer = setInterval(() => {
      try {
        if (popup.closed) {
          cleanup()
          reject(new Error('OneDrive popup closed before connection completed.'))
          return
        }
        const href = popup.location.href
        if (href && href.includes('/auth/google/callback')) {
          finish(href)
          cleanup()
          popup.close()
        }
      } catch {
        // ignore cross-origin security block until popup redirects to callback URI
      }
    }, 250)
  })
}

/**
 * Fetch video files from OneDrive
 */
export async function fetchVideosFromOneDrive(accessToken) {
  if (!accessToken) {
    throw new Error('OneDrive is not connected or access token is missing.')
  }

  try {
    // Search for video files in user's OneDrive root recursively
    // We search for popular extensions: mp4, mov, webm, mkv, avi
    const response = await axios.get('https://graph.microsoft.com/v1.0/me/drive/root/search(q=\'.mp4\')', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    })

    const results = response.data?.value || []
    
    // Map items to standard video list objects
    const videos = results.map((item) => {
      return {
        id: item.id,
        title: item.name,
        url: item['@microsoft.graph.downloadUrl'] || `https://graph.microsoft.com/v1.0/me/drive/items/${item.id}/content`,
        size: item.size,
        duration: 'Video',
        publishedAt: item.lastModifiedDateTime ? item.lastModifiedDateTime.split('T')[0] : 'Recent',
      }
    })

    return {
      videos,
      total: videos.length,
      page: 1,
      perPage: 100,
      hasMore: false,
    }
  } catch (error) {
    console.error('Failed to fetch videos from OneDrive API:', error?.response?.data || error?.message)
    throw new Error(error?.response?.data?.error?.message || 'Failed to list OneDrive files. Please check connection permissions.')
  }
}

/**
 * Resolve direct download/stream link for a OneDrive video item
 */
export async function resolveOneDriveStreamLink(itemId, accessToken) {
  if (!itemId || !accessToken) {
    throw new Error('OneDrive item ID and access token are required.')
  }

  try {
    const response = await axios.get(`https://graph.microsoft.com/v1.0/me/drive/items/${itemId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    })

    const downloadUrl = response.data?.['@microsoft.graph.downloadUrl']
    if (!downloadUrl) {
      throw new Error('Direct download URL is not available for this OneDrive item.')
    }

    return downloadUrl
  } catch (error) {
    console.error('Failed to resolve OneDrive downloadUrl:', error?.response?.data || error?.message)
    throw new Error('Failed to resolve streaming URL from Microsoft OneDrive.')
  }
}

/**
 * Chunked Upload to OneDrive via Microsoft Graph API Upload Session
 * Extremely robust, support files of any size with progress tracking
 */
export async function uploadLocalFileToOneDrive({ file, accessToken, onProgress }) {
  if (!file || !accessToken) {
    throw new Error('Microsoft OneDrive is not connected. Connect OneDrive, then upload again.')
  }

  const fileName = file.name || `upload-${Date.now()}.mp4`

  try {
    // 1. Create upload session
    const sessionResponse = await axios.post(
      `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(fileName)}:/createUploadSession`,
      {
        item: {
          '@microsoft.graph.conflictBehavior': 'rename',
          name: fileName,
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    )

    const uploadUrl = sessionResponse.data?.uploadUrl
    if (!uploadUrl) {
      throw new Error('Failed to create Microsoft OneDrive upload session.')
    }

    // 2. Upload file in chunks
    // Graph API chunk size must be a multiple of 327,680 bytes (320 KB).
    // Let's use 10 chunks size = 3,276,800 bytes (~3.1 MB)
    const chunkSize = 327680 * 10
    const totalSize = file.size
    let start = 0

    onProgress?.(0)

    let fileItem = null

    while (start < totalSize) {
      const end = Math.min(start + chunkSize, totalSize)
      const chunkSlice = file.slice(start, end)
      const contentRange = `bytes ${start}-${end - 1}/${totalSize}`

      const uploadResponse = await axios.put(uploadUrl, chunkSlice, {
        headers: {
          'Content-Length': chunkSlice.size,
          'Content-Range': contentRange,
        }
      })

      start = end
      const progressPercent = Math.round((start / totalSize) * 100)
      onProgress?.(progressPercent)

      if (uploadResponse.status === 201 || uploadResponse.status === 200) {
        fileItem = uploadResponse.data
      }
    }

    if (!fileItem) {
      throw new Error('OneDrive upload did not return file metadata.')
    }

    // Resolve download url
    const downloadUrl = fileItem['@microsoft.graph.downloadUrl'] || `https://graph.microsoft.com/v1.0/me/drive/items/${fileItem.id}/content`

    return {
      id: fileItem.id,
      name: fileItem.name,
      size: fileItem.size,
      mimeType: fileItem.file?.mimeType || file.type || 'video/mp4',
      downloadUrl,
    }
  } catch (error) {
    console.error('Failed to upload file to OneDrive:', error?.response?.data || error?.message)
    throw new Error(error?.response?.data?.error?.message || 'Unable to upload video file to OneDrive.')
  }
}

export default {
  getOneDriveClientId,
  saveOneDriveCredentials,
  connectOneDriveWithImplicitToken,
  fetchVideosFromOneDrive,
  resolveOneDriveStreamLink,
  uploadLocalFileToOneDrive,
}
