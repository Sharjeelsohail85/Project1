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

/**
 * Uploads a local file to Dropbox and returns a direct streamable shared link.
 * @param {File} file
 * @param {Function} onProgress
 */
export async function uploadToDropboxAndGetLink(file, onProgress) {
  const token = getDropboxAccessToken()
  if (!token) {
    throw new Error('Dropbox is not connected. Please connect Dropbox first.')
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `/uploads/${Date.now()}_${safeFileName}`

  // 1. Upload video file
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

  const metadata = response.data
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
          throw new Error(
            `Failed to share file on Dropbox: ${
              errorA?.response?.data?.error_summary || errorA?.message
            }`
          )
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
