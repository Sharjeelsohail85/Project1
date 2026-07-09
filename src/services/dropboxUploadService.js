import axios from 'axios'
import { getConnectedAccounts } from './linkedAccountService'

export function getDropboxAccessToken() {
  const accounts = getConnectedAccounts()
  const dropboxAccount = accounts.find(
    (a) => a.provider === 'dropbox' && a.connected
  )
  return (
    dropboxAccount?.user?.dropbox_access_token ||
    dropboxAccount?.user?.access_token ||
    ''
  )
}

export function isDropboxConnected() {
  return Boolean(getDropboxAccessToken())
}

export function isDropboxDemoToken(token) {
  if (!token) return true
  const t = String(token).trim()
  return (
    t === 'sandbox_token' ||
    t.startsWith('sandbox_') ||
    t.startsWith('sl.u.AGln-W62G7Iv')
  )
}

export async function refreshDropboxAccessToken() {
  const accounts = getConnectedAccounts()
  const dropboxAccountIndex = accounts.findIndex(
    (a) => a.provider === 'dropbox' && a.connected
  )
  if (dropboxAccountIndex === -1) {
    console.warn('No connected Dropbox account found to refresh.')
    return null
  }

  const dropboxAccount = accounts[dropboxAccountIndex]
  const user = dropboxAccount.user || {}
  
  // Get the refresh token
  const refreshToken = user.dropbox_refresh_token || user.refresh_token || ''
  if (!refreshToken) {
    console.warn('No Dropbox refresh token found for automatic refresh.')
    return null
  }

  // Get client ID and client secret
  let clientId = 'dcuykx3y074l3er' // default
  let clientSecret = ''
  
  try {
    const customId = localStorage.getItem('custom_dropbox_client_id')
    const customSecret = localStorage.getItem('custom_dropbox_client_secret')
    if (customId && customId.trim()) {
      clientId = customId.trim()
    }
    if (customSecret && customSecret.trim()) {
      clientSecret = customSecret.trim()
    }
  } catch {
    // ignore
  }

  console.log('Attempting to refresh Dropbox access token...', { clientId, hasSecret: Boolean(clientSecret) })

  try {
    const params = new URLSearchParams()
    params.append('grant_type', 'refresh_token')
    params.append('refresh_token', refreshToken)
    params.append('client_id', clientId)
    if (clientSecret) {
      params.append('client_secret', clientSecret)
    }

    const tokenUrl = 'https://api.dropboxapi.com/oauth2/token'
    const response = await axios.post(tokenUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const data = response?.data || {}
    const newAccessToken = data.access_token || ''
    if (!newAccessToken) {
      throw new Error('Dropbox refresh response did not contain access_token.')
    }

    // Update the connected accounts list in localStorage
    user.dropbox_access_token = newAccessToken
    user.access_token = newAccessToken
    
    if (data.refresh_token) {
      user.dropbox_refresh_token = data.refresh_token
      user.refresh_token = data.refresh_token
    }

    dropboxAccount.user = user
    accounts[dropboxAccountIndex] = dropboxAccount
    
    try {
      localStorage.setItem('connected_accounts', JSON.stringify(accounts))
    } catch (err) {
      console.error('Failed to save refreshed accounts to localStorage:', err)
    }

    console.log('Successfully refreshed Dropbox access token.')
    return newAccessToken
  } catch (refreshError) {
    console.error('Failed to refresh Dropbox access token:', refreshError?.response?.data || refreshError?.message)
    throw refreshError
  }
}

export async function validateTokenAndRefreshIfNeeded() {
  let token = getDropboxAccessToken()
  if (!token) return ''

  if (isDropboxDemoToken(token)) {
    return token
  }

  try {
    // Validate token
    await axios.post('https://api.dropboxapi.com/2/users/get_current_account', null, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return token
  } catch (error) {
    const isExpired = error?.response?.status === 401 ||
                      String(error?.response?.data?.error_summary || '').toLowerCase().includes('expired_access_token') ||
                      String(error?.response?.data?.error || '').toLowerCase().includes('expired_access_token')

    if (isExpired) {
      try {
        const refreshedToken = await refreshDropboxAccessToken()
        if (refreshedToken) {
          return refreshedToken
        }
      } catch (refreshErr) {
        console.error('Failed to auto-refresh token:', refreshErr)
      }
    }
    
    throw error
  }
}

/**
 * Uploads a local file to Dropbox and returns a direct streamable shared link.
 * @param {File} file
 * @param {Function} onProgress
 */
export async function uploadToDropboxAndGetLink(file, onProgress) {
  const rawToken = getDropboxAccessToken()
  if (!rawToken) {
    throw new Error('Dropbox is not connected. Please connect Dropbox first.')
  }

  // Pre-validate token and refresh if expired
  const token = await validateTokenAndRefreshIfNeeded()

  if (isDropboxDemoToken(token)) {
    if (typeof onProgress === 'function') {
      onProgress(15)
      await new Promise((resolve) => setTimeout(resolve, 250))
      onProgress(45)
      await new Promise((resolve) => setTimeout(resolve, 250))
      onProgress(80)
      await new Promise((resolve) => setTimeout(resolve, 300))
      onProgress(100)
    }
    // Return a reliable, fast, direct-playback video URL for instant testing
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `/uploads/${Date.now()}_${safeFileName}`

  let metadata

  if (file.size <= 20 * 1024 * 1024) {
    // 1. Upload video file (single shot for small files)
    const uploadUrl = 'https://content.dropboxapi.com/2/files/upload'
    const uploadArgs = {
      path,
      mode: 'add',
      autorename: true,
      mute: false,
      strict_conflict: false,
    }

    const response = await axios.post(uploadUrl, file, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Dropbox-API-Arg': JSON.stringify(uploadArgs),
        'Content-Type': 'application/octet-stream',
      },
      onUploadProgress: (event) => {
        if (typeof onProgress === 'function' && event.total) {
          const percentage = Math.min(
            99,
            Math.round((event.loaded * 100) / event.total)
          )
          onProgress(percentage)
        }
      },
    })
    metadata = response.data
  } else {
    // 1. Upload video file (chunked upload session for large files to bypass 150MB API limit)
    const CHUNK_SIZE = 4 * 1024 * 1024 // 4MB chunks
    let sessionId = ''
    let offset = 0

    // Start session
    const startUrl = 'https://content.dropboxapi.com/2/files/upload_session/start'
    const startChunk = file.slice(0, CHUNK_SIZE)
    const startRes = await axios.post(startUrl, startChunk, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Dropbox-API-Arg': JSON.stringify({ close: false }),
        'Content-Type': 'application/octet-stream',
      }
    })
    sessionId = startRes.data.session_id
    offset += startChunk.size

    if (typeof onProgress === 'function') {
      onProgress(Math.min(99, Math.round((offset * 100) / file.size)))
    }

    // Append chunks
    const appendUrl = 'https://content.dropboxapi.com/2/files/upload_session/append_v2'
    while (offset < file.size - CHUNK_SIZE) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE)
      await axios.post(appendUrl, chunk, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Dropbox-API-Arg': JSON.stringify({
            close: false,
            cursor: { session_id: sessionId, offset }
          }),
          'Content-Type': 'application/octet-stream',
        }
      })
      offset += chunk.size
      if (typeof onProgress === 'function') {
        onProgress(Math.min(99, Math.round((offset * 100) / file.size)))
      }
    }

    // Finish session
    const finishUrl = 'https://content.dropboxapi.com/2/files/upload_session/finish'
    const lastChunk = file.slice(offset)
    const finishRes = await axios.post(finishUrl, lastChunk, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Dropbox-API-Arg': JSON.stringify({
          cursor: { session_id: sessionId, offset },
          commit: {
            path,
            mode: 'add',
            autorename: true,
            mute: false,
            strict_conflict: false,
          }
        }),
        'Content-Type': 'application/octet-stream',
      }
    })
    metadata = finishRes.data
  }

  const uploadedPath = metadata.path_display || path

  // 2. Resolve or Create stream URL with multiple fallbacks
  const shareSettingsUrl = 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings'
  const listUrl = 'https://api.dropboxapi.com/2/sharing/list_shared_links'
  const tempLinkUrl = 'https://api.dropboxapi.com/2/files/get_temporary_link'

  let streamUrl = ''

  // Attempt A: Create shared link with public visibility
  try {
    const shareResponse = await axios.post(
      shareSettingsUrl,
      {
        path: uploadedPath,
        settings: {
          requested_visibility: 'public',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )
    streamUrl = shareResponse?.data?.url || ''
  } catch (errorA) {
    const errorSummaryA = errorA?.response?.data?.error_summary || ''
    console.warn('Dropbox Attempt A (public settings) failed:', errorSummaryA || errorA?.message)

    // Attempt B: Create shared link with default settings (no settings object)
    try {
      const shareResponse = await axios.post(
        shareSettingsUrl,
        {
          path: uploadedPath,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      streamUrl = shareResponse?.data?.url || ''
    } catch (errorB) {
      const errorSummaryB = errorB?.response?.data?.error_summary || ''
      console.warn('Dropbox Attempt B (default settings) failed:', errorSummaryB || errorB?.message)

      // Attempt C: List already existing shared links (direct_only: true)
      try {
        const listResponse = await axios.post(
          listUrl,
          {
            path: uploadedPath,
            direct_only: true,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        const links = listResponse.data?.links || []
        if (links.length > 0) {
          streamUrl = links[0].url || ''
        }
      } catch (errorC) {
        console.warn('Dropbox Attempt C (list direct_only) failed:', errorC?.message)
      }

      // Attempt D: List already existing shared links without direct_only constraint
      if (!streamUrl) {
        try {
          const listResponse = await axios.post(
            listUrl,
            {
              path: uploadedPath,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          )
          const links = listResponse.data?.links || []
          if (links.length > 0) {
            streamUrl = links[0].url || ''
          }
        } catch (errorD) {
          console.warn('Dropbox Attempt D (list default) failed:', errorD?.message)
        }
      }

      // Attempt E: Get temporary link (guaranteed fallback link, valid for 4 hours)
      if (!streamUrl) {
        try {
          const tempResponse = await axios.post(
            tempLinkUrl,
            {
              path: uploadedPath,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          )
          streamUrl = tempResponse?.data?.link || ''
        } catch (errorE) {
          console.error('Dropbox Attempt E (get_temporary_link) failed:', errorE?.message)
          const errSummary = errorE?.response?.data?.error_summary
            || errorA?.response?.data?.error_summary
            || errorE?.message
            || errorA?.message
            || 'Unknown error'
          throw new Error(`Failed to share file on Dropbox: ${errSummary}`)
        }
      }
    }
  }

  // Format the resulting stream/playback URL
  if (streamUrl) {
    if (streamUrl.includes('?')) {
      streamUrl = streamUrl.replace('dl=0', 'raw=1')
      if (!streamUrl.includes('raw=1')) {
        streamUrl += '&raw=1'
      }
    } else {
      streamUrl += '?raw=1'
    }
  }

  if (typeof onProgress === 'function') {
    onProgress(100)
  }

  return streamUrl
}

/**
 * Resolves a live streamable link for a given Dropbox file path
 * @param {string} path - Dropbox path (e.g., /video.mp4)
 * @param {string} token - Dropbox access token
 * @returns {Promise<string>} Streamable URL
 */
export async function resolveDropboxStreamLink(path, token) {
  if (!token) throw new Error('No access token provided')
  
  const validatedToken = await validateTokenAndRefreshIfNeeded(token)

  const shareSettingsUrl = 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings'
  const listUrl = 'https://api.dropboxapi.com/2/sharing/list_shared_links'
  const tempLinkUrl = 'https://api.dropboxapi.com/2/files/get_temporary_link'

  let streamUrl = ''

  // Attempt A: Create shared link with public visibility
  try {
    const shareResponse = await axios.post(
      shareSettingsUrl,
      {
        path: path,
        settings: {
          requested_visibility: 'public',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${validatedToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
    streamUrl = shareResponse?.data?.url || ''
  } catch (errorA) {
    // Attempt B: Create shared link with default settings
    try {
      const shareResponse = await axios.post(
        shareSettingsUrl,
        {
          path: path,
        },
        {
          headers: {
            Authorization: `Bearer ${validatedToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
      streamUrl = shareResponse?.data?.url || ''
    } catch (errorB) {
      // Attempt C: List already existing shared links (direct_only: true)
      try {
        const listResponse = await axios.post(
          listUrl,
          {
            path: path,
            direct_only: true,
          },
          {
            headers: {
              Authorization: `Bearer ${validatedToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
        const links = listResponse.data?.links || []
        if (links.length > 0) {
          streamUrl = links[0].url || ''
        }
      } catch (errorC) {
        // Attempt D: List already existing shared links without direct_only
        try {
          const listResponse = await axios.post(
            listUrl,
            {
              path: path,
            },
            {
              headers: {
                Authorization: `Bearer ${validatedToken}`,
                'Content-Type': 'application/json',
              },
            }
          )
          const links = listResponse.data?.links || []
          if (links.length > 0) {
            streamUrl = links[0].url || ''
          }
        } catch (errorD) {
          // Attempt E: Get temporary link (guaranteed fallback link, valid for 4 hours)
          try {
            const tempResponse = await axios.post(
              tempLinkUrl,
              {
                path: path,
              },
              {
                headers: {
                  Authorization: `Bearer ${validatedToken}`,
                  'Content-Type': 'application/json',
                },
              }
            )
            streamUrl = tempResponse?.data?.link || ''
          } catch (errorE) {
            throw new Error(`Failed to resolve Dropbox stream link: ${errorE.message}`)
          }
        }
      }
    }
  }

  // Format resulting stream/playback URL
  if (streamUrl) {
    if (streamUrl.includes('?')) {
      streamUrl = streamUrl.replace('dl=0', 'raw=1')
      if (!streamUrl.includes('raw=1')) {
        streamUrl += '&raw=1'
      }
    } else {
      streamUrl += '?raw=1'
    }
  }

  return streamUrl
}
