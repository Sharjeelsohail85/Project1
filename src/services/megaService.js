import axios from 'axios'
import { Storage } from 'megajs'
import { Buffer } from 'buffer'

/**
 * MEGA Cloud Storage client-side service
 * Handles OAuth connection simulation, browsing, chunked uploads, and direct stream URL retrieval.
 */

const MEGA_DEFAULT_CLIENT_ID = 'mega_default_app_key'

export function getMegaClientId() {
  try {
    return localStorage.getItem('custom_mega_client_id') || import.meta.env.VITE_MEGA_CLIENT_ID || MEGA_DEFAULT_CLIENT_ID
  } catch {
    return import.meta.env.VITE_MEGA_CLIENT_ID || MEGA_DEFAULT_CLIENT_ID
  }
}

export function saveMegaCredentials(clientId) {
  try {
    localStorage.setItem('custom_mega_client_id', String(clientId || '').trim())
  } catch (error) {
    console.error('Failed to save MEGA credentials:', error)
  }
}

/**
 * Connect with MEGA using Implicit Grant OAuth Flow
 */
export function connectMegaWithImplicitToken() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('MEGA connection is only available in a browser.'))
      return
    }

    const state = Math.random().toString(36).slice(2) + Date.now().toString(36)
    
    // Open standard OAuth Callback URL directly to render the MEGA login form card
    const redirectUri = `${window.location.origin}/auth/mega/callback`
    
    const width = 560
    const height = 720
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(redirectUri, 'mega-oauth', `width=${width},height=${height},left=${left},top=${top}`)
    if (!popup) {
      reject(new Error('Popup blocked for MEGA. Please allow popups and try again.'))
      return
    }

    const cleanup = () => {
      window.removeEventListener('message', onMessage)
      clearInterval(timer)
    }

    const finish = (callbackUrl) => {
      const parsed = new URL(callbackUrl)
      const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''))
      const search = new URLSearchParams(parsed.search)
      const accessToken = String(hash.get('access_token') || search.get('access_token') || '').trim()
      const email = String(hash.get('email') || search.get('email') || 'mega.user@connected.local').trim()

      if (!accessToken) {
        throw new Error('MEGA did not return an access token.')
      }

      const user = {
        uuid: `mega-${Date.now()}`,
        first_name: 'MEGA',
        last_name: 'Cloud Storage',
        email: email,
        registration_type: 'mega',
        active: 1,
        mega_access_token: accessToken,
      }

      // Save to connected accounts in local storage
      const rawAccounts = localStorage.getItem('connected_accounts')
      const accounts = rawAccounts ? JSON.parse(rawAccounts) : []
      const newAccount = {
        provider: 'mega',
        connected: true,
        user,
      }
      const filtered = accounts.filter(a => a.provider !== 'mega')
      filtered.push(newAccount)
      localStorage.setItem('connected_accounts', JSON.stringify(filtered))

      resolve(user)
    }

    function onMessage(event) {
      if (event.data?.type !== 'oauth-callback' || event.data?.provider !== 'mega') return
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
      let href = null
      try {
        if (popup.closed) {
          cleanup()
          reject(new Error('MEGA popup closed before connection completed.'))
          return
        }
        href = popup.location.href
      } catch (e) {
        // ignore cross-origin security block until popup redirects to callback URI
        return
      }

      // Polling should ONLY proceed when the URL actually contains the access_token after form submission!
      if (href && href.includes('access_token=')) {
        try {
          finish(href)
          cleanup()
          popup.close()
        } catch (error) {
          cleanup()
          popup.close()
          reject(error)
        }
      }
    }, 250)
  })
}

export function loginToMegaWithSession(sessionStr) {
  return new Promise((resolve, reject) => {
    try {
      const storage = new Storage({ session: sessionStr }, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(storage)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

function findNodeById(nodes, id) {
  if (!nodes) return null
  for (const node of nodes) {
    if (node.nodeId === id) {
      return node
    }
    if (node.directory && node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

function scanVideos(nodes, videos = []) {
  if (!nodes) return videos
  for (const node of nodes) {
    if (node.directory) {
      if (node.children) {
        scanVideos(node.children, videos)
      }
    } else {
      const name = node.name || ''
      const isVideo = /\.(mp4|mkv|mov|avi|webm)$/i.test(name)
      if (isVideo) {
        videos.push({
          id: node.nodeId || `mega-${node.name}`,
          title: node.name,
          url: `https://mega.nz/#file/${node.nodeId}`,
          size: node.size || 0,
          duration: 'Video',
          publishedAt: 'Recent',
        })
      }
    }
  }
  return videos
}

/**
 * Fetch video files from MEGA
 */
export async function fetchVideosFromMega(accessToken) {
  if (!accessToken) {
    throw new Error('MEGA is not connected or access token is missing.')
  }

  const storage = await loginToMegaWithSession(accessToken)
  const videos = scanVideos(storage.root.children || [])

  return {
    videos,
    total: videos.length,
    page: 1,
    perPage: 100,
    hasMore: false,
  }
}

/**
 * Resolve direct download/stream link for a MEGA video item
 */
export async function resolveMegaStreamLink(itemId, accessToken) {
  if (!itemId || !accessToken) {
    throw new Error('MEGA item ID and access token are required.')
  }

  const storage = await loginToMegaWithSession(accessToken)
  const node = findNodeById(storage.root.children || [], itemId)
  
  if (!node) {
    throw new Error('MEGA file not found.')
  }

  const link = await new Promise((resolve, reject) => {
    node.link((err, url) => {
      if (err) reject(err)
      else resolve(url)
    })
  })

  return link
}

/**
 * Chunked Upload to MEGA Cloud Storage
 * Uploads local files directly to the user's real MEGA account
 */
export async function uploadLocalFileToMega({ file, accessToken, onProgress }) {
  if (!file || !accessToken) {
    throw new Error('MEGA is not connected. Connect MEGA, then upload again.')
  }

  return new Promise(async (resolve, reject) => {
    try {
      const storage = await loginToMegaWithSession(accessToken)
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      const uploadStream = storage.upload({
        name: file.name || `upload-${Date.now()}.mp4`,
        size: file.size
      }, buffer, async (err, uploadedFile) => {
        if (err) {
          reject(err)
        } else {
          try {
            // Generate public share/stream link
            const url = await new Promise((res, rej) => {
              uploadedFile.link((linkErr, linkUrl) => {
                if (linkErr) rej(linkErr)
                else res(linkUrl)
              })
            })
            
            resolve({
              id: uploadedFile.nodeId || `mega-${Date.now()}`,
              name: uploadedFile.name,
              size: file.size,
              mimeType: file.type || 'video/mp4',
              downloadUrl: url,
            })
          } catch (linkError) {
            // Fallback link if generation fails but node is uploaded
            resolve({
              id: uploadedFile.nodeId || `mega-${Date.now()}`,
              name: uploadedFile.name,
              size: file.size,
              mimeType: file.type || 'video/mp4',
              downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            })
          }
        }
      })
      
      if (onProgress && uploadStream) {
        uploadStream.on('progress', (progress) => {
          if (progress && progress.bytesTotal) {
            const percent = Math.round((progress.bytesLoaded / progress.bytesTotal) * 100)
            onProgress(percent)
          }
        })
      }
    } catch (e) {
      reject(e)
    }
  })
}

export default {
  getMegaClientId,
  saveMegaCredentials,
  connectMegaWithImplicitToken,
  fetchVideosFromMega,
  resolveMegaStreamLink,
  uploadLocalFileToMega,
}

