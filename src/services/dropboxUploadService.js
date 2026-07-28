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

  // 2. Create public shared link
  const shareSettingsUrl =
    'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings'
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

    if (typeof onProgress === 'function') onProgress(100)
    return shareResponse.data.url
  } catch (error) {
    // If link already exists, try to list shared links
    const errorMsg = error?.response?.data?.error_summary || ''
    if (errorMsg.includes('shared_link_already_exists')) {
      const listUrl = 'https://api.dropboxapi.com/2/sharing/list_shared_links'
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
        if (typeof onProgress === 'function') onProgress(100)
        return links[0].url
      }
    }

    throw new Error(
      `Failed to share file on Dropbox: ${
        error?.response?.data?.error?.shared_link_already_exists ||
        error.message
      }`
    )
  }
}
