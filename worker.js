function createRandomId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function toNameParts(rawName, fallbackFirst = 'User', fallbackLast = 'User') {
  const normalized = String(rawName || '').trim()
  if (!normalized) {
    return [fallbackFirst, fallbackLast]
  }

  const parts = normalized.split(/\s+/).filter(Boolean)
  const firstName = parts[0] || fallbackFirst
  const lastName = parts.slice(1).join(' ') || fallbackLast
  return [firstName, lastName]
}

function normalizeEmail(rawEmail, fallbackLocal = 'user') {
  const normalized = String(rawEmail || '').trim().toLowerCase()
  if (normalized.includes('@')) {
    return normalized
  }

  const localPart = String(fallbackLocal || 'user')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')

  return `${localPart || 'user'}@octopussol.local`
}

function getPayloadData(payload) {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  if (payload.data && typeof payload.data === 'object') {
    return payload.data
  }

  return payload
}

function buildDemoAuthBody({ provider = 'general', firstName, lastName, email }) {
  const randomId = createRandomId()
  const tokenPrefix = provider === 'general' ? 'password' : provider

  return {
    status: 200,
    data: {
      token: `${tokenPrefix}-demo-token-${randomId}`,
      client_id: 'web_client',
      device: 'web-browser',
      os: 'web',
      user: {
        uuid: `${tokenPrefix}-demo-user-${randomId}`,
        first_name: firstName,
        last_name: lastName,
        email,
        registration_type: provider,
        active: 1,
        color: null,
      },
      fallback_mode: true,
    },
  }
}

function buildJsonHeaders() {
  return {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type, token, client_id, authorization, x-google-access-token',
  }
}

function shouldBypassInfinityFreeChallenge(hostname, pathname) {
  const host = String(hostname || '').trim().toLowerCase()
  const path = normalizePathname(pathname)

  if (!host.endsWith('.gamer.gd')) {
    return false
  }

  return path.startsWith('/api/v1/')
}

async function solveInfinityFreeChallenge(request, response) {
  const html = await response.text()
  const hexMatches = [...html.matchAll(/"([0-9a-f]{32})"/gi)]
  if (hexMatches.length < 3 || !html.includes('__test=')) {
    return null
  }

  const keyHex = hexMatches[0][1]
  const ivHex = hexMatches[1][1]
  const cipherHex = hexMatches[2][1]

  let keyBytes
  let ivBytes
  let cipherBytes

  try {
    keyBytes = Uint8Array.from(keyHex.match(/../g).map((x) => parseInt(x, 16)))
    ivBytes = Uint8Array.from(ivHex.match(/../g).map((x) => parseInt(x, 16)))
    cipherBytes = Uint8Array.from(cipherHex.match(/../g).map((x) => parseInt(x, 16)))
  } catch {
    return null
  }

  try {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    )

    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: ivBytes },
      cryptoKey,
      cipherBytes
    )

    const plainBytes = new Uint8Array(plainBuffer)
    const cookieHex = [...plainBytes]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')

    if (!cookieHex) {
      return null
    }

    const upstreamUrl = new URL(request.url)
    const challengeUrl = new URL(upstreamUrl.toString())
    challengeUrl.searchParams.set('i', '1')

    const headers = new Headers(request.headers)
    headers.set('cookie', `__test=${cookieHex}`)
    headers.delete('host')

    const shouldIncludeBody = request.method !== 'GET' && request.method !== 'HEAD'
    return fetch(challengeUrl.toString(), {
      method: request.method,
      headers,
      redirect: 'manual',
      body: shouldIncludeBody ? request.body : undefined,
    })
  } catch {
    return null
  }
}

async function parseBodyData(request) {
  try {
    const payload = await request.clone().json()
    return getPayloadData(payload)
  } catch {
    return {}
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: buildJsonHeaders(),
  })
}

function normalizePathname(pathname) {
  const normalized = String(pathname || '').trim()
  if (!normalized) return '/'

  const withoutTrailingSlashes = normalized.replace(/\/+$/, '')
  return withoutTrailingSlashes || '/'
}

function stripTrailingSlashes(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function resolveApiUpstreamOrigin(env) {
  const candidates = [
    env?.API_UPSTREAM_ORIGIN,
    env?.LARAVEL_API_ORIGIN,
    env?.PRODUCTION_API_ORIGIN,
  ]

  for (const candidate of candidates) {
    const normalized = stripTrailingSlashes(candidate)
    if (!normalized) continue

    const withProtocol = /^(https?:)\/\//i.test(normalized)
      ? normalized
      : `https://${normalized}`

    try {
      const parsed = new URL(withProtocol)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        continue
      }

      return `${parsed.protocol}//${parsed.host}`
    } catch {
      // Ignore invalid candidate and keep checking.
    }
  }

  return ''
}

function resolveCanonicalHost(env) {
  const normalized = String(env?.CANONICAL_HOST || '').trim().toLowerCase()
  if (!normalized || normalized.includes('/') || normalized.includes(':')) {
    return ''
  }

  return normalized
}

function isApiPath(pathname) {
  return normalizePathname(pathname).startsWith('/api/v1/')
}

async function proxyApiRequestToUpstream(request, upstreamOrigin) {
  const incomingUrl = new URL(request.url)
  const upstreamUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, `${upstreamOrigin}/`)

  if (incomingUrl.host === upstreamUrl.host) {
    return jsonResponse({
      status: 500,
      error_description: [
        'Invalid API upstream origin. Use a separate backend host or subdomain to avoid a proxy loop.',
      ],
      message: 'Worker upstream proxy misconfigured.',
    }, 500)
  }

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('cf-connecting-ip')
  headers.delete('cf-ipcountry')
  headers.delete('cf-ray')
  headers.set('x-forwarded-host', incomingUrl.host)
  headers.set('x-forwarded-proto', incomingUrl.protocol.replace(':', ''))

  const clientIp = String(request.headers.get('cf-connecting-ip') || '').trim()
  if (clientIp) {
    headers.set('x-forwarded-for', clientIp)
  }

  const shouldIncludeBody = request.method !== 'GET' && request.method !== 'HEAD'
  const proxyRequest = new Request(upstreamUrl.toString(), {
    method: request.method,
    headers,
    redirect: 'manual',
    body: shouldIncludeBody ? request.body : undefined,
  })

  const upstreamResponse = await fetch(proxyRequest)

  if (shouldBypassInfinityFreeChallenge(upstreamUrl.hostname, upstreamUrl.pathname)) {
    const contentType = String(upstreamResponse.headers.get('content-type') || '').toLowerCase()
    if (upstreamResponse.ok && contentType.includes('text/html')) {
      const solvedResponse = await solveInfinityFreeChallenge(proxyRequest, upstreamResponse.clone())
      if (solvedResponse) {
        return solvedResponse
      }
    }
  }

  return upstreamResponse
}

function buildDemoTagList() {
  return [
    { uuid: 'demo-tag-1', name: 'Music', active: 1 },
    { uuid: 'demo-tag-2', name: 'Gaming', active: 1 },
    { uuid: 'demo-tag-3', name: 'Technology', active: 1 },
    { uuid: 'demo-tag-4', name: 'Sports', active: 1 },
    { uuid: 'demo-tag-5', name: 'Education', active: 1 },
  ]
}

function normalizeProviderId(rawProvider) {
  const normalized = String(rawProvider || '').trim().toLowerCase()
  if (!normalized) return ''

  if (normalized === 'google' || normalized === 'googledrive' || normalized === 'google-drive') {
    return 'gdrive'
  }

  return normalized
}

function buildProviderDisplayName(providerId) {
  const normalized = normalizeProviderId(providerId)
  switch (normalized) {
    case 'gdrive':
      return 'Google Drive'
    case 'dropbox':
      return 'Dropbox'
    case 'idrive':
      return 'IDrive e2'
    case 's3':
      return 'Custom S3'
    default:
      return normalized || 'Storage Provider'
  }
}

function buildProviderOAuthDemoPayload(providerId) {
  const normalized = normalizeProviderId(providerId)
  const displayName = buildProviderDisplayName(normalized)
  const state = createRandomId()

  return {
    status: 200,
    data: {
      provider: normalized,
      displayName,
      connected: true,
      requiresSetup: false,
      requiresOAuthWindow: false,
      missingFields: [],
      oauthUrl: '',
      authUrl: '',
      message: `${displayName} connected in demo mode.`,
      state,
      fallback_mode: true,
    },
  }
}

const demoMigrationJobs = new Map()
const postedVideosByUser = new Map()
const DEMO_MIGRATION_STREAM_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

function getRequesterKey(request) {
  const authHeader = String(request.headers.get('authorization') || '').trim()
  const tokenHeader = String(request.headers.get('token') || '').trim()
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || tokenHeader || 'anonymous'
  return token || 'anonymous'
}

function getPostedVideosForRequest(request) {
  const key = getRequesterKey(request)
  return postedVideosByUser.get(key) || []
}

function savePostedVideoForRequest(request, video) {
  const key = getRequesterKey(request)
  const current = postedVideosByUser.get(key) || []
  const next = [video, ...current]
  postedVideosByUser.set(key, next)
  return next
}

function extractGoogleDriveFileId(webViewLink = '') {
  const value = String(webViewLink || '').trim()
  const match = value.match(/\/file\/d\/([^/]+)/i) || value.match(/[?&]id=([^&]+)/i)
  return match ? decodeURIComponent(match[1]) : ''
}

function buildGoogleDriveDownloadUrl(sourceUrl = '') {
  const fileId = extractGoogleDriveFileId(sourceUrl)
  if (!fileId) {
    return String(sourceUrl || '').trim()
  }

  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
}

function buildGoogleDriveProxyPlaybackUrl(fileId = '', accessToken = '') {
  const normalizedFileId = String(fileId || '').trim()
  if (!normalizedFileId) return ''

  const token = String(accessToken || '').trim()
  const tokenQuery = token ? `?access_token=${encodeURIComponent(token)}` : ''
  return `/api/v1/google-drive/stream/${encodeURIComponent(normalizedFileId)}${tokenQuery}`
}

function normalizeLinkedAccountPlaybackUrl(sourceUrl = '') {
  const normalized = String(sourceUrl || '').trim()
  if (!normalized) return ''

  if (/^https?:\/\/(?:drive|docs)\.google\.com\//i.test(normalized)) {
    return buildGoogleDriveDownloadUrl(normalized)
  }

  return normalized
}

function normalizeGoogleDriveVideo(file) {
  const id = String(file?.id || extractGoogleDriveFileId(file?.webViewLink) || createRandomId()).trim()
  const name = String(file?.name || `Google Drive video ${id.slice(0, 8)}`).trim()
  const webViewLink = String(file?.webViewLink || `https://drive.google.com/file/d/${id}/view`).trim()
  const webContentLink = String(file?.webContentLink || '').trim()

  return {
    id,
    title: name,
    url: webContentLink || webViewLink,
    sourceUrl: webContentLink || webViewLink,
    thumbnail: String(file?.thumbnailLink || '').trim(),
    duration: '',
    publishedAt: String(file?.createdTime || file?.modifiedTime || '').slice(0, 10),
    mimeType: String(file?.mimeType || 'video/mp4').trim(),
  }
}

async function createGoogleDriveShortcut({ accessToken, sourceUrl, title }) {
  const targetId = extractGoogleDriveFileId(sourceUrl)
  if (!targetId) return null

  const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink,webContentLink,mimeType,thumbnailLink,createdTime', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: title,
      mimeType: 'application/vnd.google-apps.shortcut',
      shortcutDetails: {
        targetId,
      },
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Unable to create Google Drive shortcut.')
  }

  return payload
}

async function uploadSourceUrlToGoogleDrive({ accessToken, sourceUrl, title, description }) {
  if (!accessToken || !sourceUrl) return null

  const normalizedSourceUrl = normalizeLinkedAccountPlaybackUrl(sourceUrl)
  const sourceDriveFileId = extractGoogleDriveFileId(sourceUrl)
  const filename = title.toLowerCase().endsWith('.mp4') ? title : `${title || inferFilenameFromSourceUrl(sourceUrl)}.mp4`

  try {
    const sourceFetchUrl = sourceDriveFileId
      ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(sourceDriveFileId)}?alt=media`
      : (normalizedSourceUrl || sourceUrl)
    const sourceHeaders = sourceDriveFileId ? { Authorization: `Bearer ${accessToken}` } : {}
    const sourceResponse = await fetch(sourceFetchUrl, { headers: sourceHeaders })
    if (!sourceResponse.ok) {
      throw new Error(`Unable to download source video (${sourceResponse.status}).`)
    }

    const contentType = String(sourceResponse.headers.get('content-type') || 'video/mp4').trim() || 'video/mp4'
    const videoBuffer = await sourceResponse.arrayBuffer()
    const boundary = `octopussol_${createRandomId().replace(/[^a-zA-Z0-9]/g, '')}`
    const metadata = {
      name: filename,
      description: description || `Imported from ${sourceUrl}`,
      mimeType: contentType,
    }
    const encoder = new TextEncoder()
    const prefix = encoder.encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
      + `--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`
    )
    const suffix = encoder.encode(`\r\n--${boundary}--`)
    const body = new Uint8Array(prefix.byteLength + videoBuffer.byteLength + suffix.byteLength)
    body.set(prefix, 0)
    body.set(new Uint8Array(videoBuffer), prefix.byteLength)
    body.set(suffix, prefix.byteLength + videoBuffer.byteLength)

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,mimeType,thumbnailLink,createdTime', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    })
    const uploadPayload = await uploadResponse.json().catch(() => ({}))
    if (!uploadResponse.ok) {
      throw new Error(uploadPayload?.error?.message || 'Unable to upload video to Google Drive.')
    }

    return uploadPayload
  } catch (error) {
    throw error
  }
}

function extractPathParam(pathname, pattern) {
  const normalizedPath = normalizePathname(pathname)
  const match = normalizedPath.match(pattern)
  if (!match || !match[1]) {
    return ''
  }

  try {
    return decodeURIComponent(match[1])
  } catch {
    return String(match[1] || '').trim()
  }
}

function inferFilenameFromSourceUrl(sourceUrl = '') {
  const normalized = String(sourceUrl || '').trim()
  if (!normalized) {
    return `video-${Date.now()}.mp4`
  }

  try {
    const parsed = new URL(normalized)
    const pathname = String(parsed.pathname || '').trim()
    const lastSegment = pathname.split('/').filter(Boolean).slice(-1)[0]
    return decodeURIComponent(lastSegment || '') || `video-${Date.now()}.mp4`
  } catch {
    return normalized.split('/').filter(Boolean).slice(-1)[0] || `video-${Date.now()}.mp4`
  }
}

function inferVideoMimeType(fileName = '') {
  const lower = String(fileName || '').trim().toLowerCase()
  if (lower.endsWith('.mov')) return 'video/quicktime'
  if (lower.endsWith('.mkv')) return 'video/x-matroska'
  if (lower.endsWith('.webm')) return 'video/webm'
  if (lower.endsWith('.avi')) return 'video/x-msvideo'
  if (lower.endsWith('.m4v')) return 'video/x-m4v'
  return 'video/mp4'
}

function inferProviderFromUploadRequest(request) {
  const url = new URL(request.url)
  const fromQuery = normalizeProviderId(url.searchParams.get('targetProvider') || '')
  if (fromQuery) return fromQuery

  const token = String(request.headers.get('content-type') || '').toLowerCase()
  if (token.includes('multipart/form-data')) {
    // Multipart parsing in Workers is expensive for demo mode; default to dropbox.
    return 'dropbox'
  }

  return 'dropbox'
}

function getOrCreateDemoMigrationJob(jobId) {
  const normalizedJobId = String(jobId || '').trim()
  if (!normalizedJobId) {
    return null
  }

  const existing = demoMigrationJobs.get(normalizedJobId)
  if (existing) {
    return existing
  }

  const fallbackJob = {
    jobId: normalizedJobId,
    createdAt: Date.now() - 12000,
    provider: 'dropbox',
    sourceUrl: '',
    metadata: { title: 'Demo migration' },
    filename: `video-${normalizedJobId.slice(0, 8)}.mp4`,
    videoId: `demo-video-${normalizedJobId.slice(0, 8)}`,
  }

  demoMigrationJobs.set(normalizedJobId, fallbackJob)
  return fallbackJob
}

function buildDemoMigrationStatusPayload(job) {
  const elapsed = Math.max(0, Date.now() - Number(job?.createdAt || Date.now()))

  let stage = 'queued'
  let progress = 5
  let completed = false

  if (elapsed >= 2000 && elapsed < 5000) {
    stage = 'downloading'
    progress = 30
  } else if (elapsed >= 5000 && elapsed < 8000) {
    stage = 'uploading'
    progress = 70
  } else if (elapsed >= 8000 && elapsed < 11000) {
    stage = 'finalizing'
    progress = 92
  } else if (elapsed >= 11000) {
    stage = 'finalizing'
    progress = 100
    completed = true
  }

  return {
    jobId: String(job?.jobId || '').trim(),
    progress,
    stage,
    completed,
    videoId: completed ? String(job?.videoId || '').trim() : null,
    playbackUrl: completed ? (String(job?.playbackUrl || '').trim() || DEMO_MIGRATION_STREAM_URL) : '',
    googleDriveFileId: completed ? String(job?.googleDriveFileId || job?.googleDriveFile?.id || '').trim() : '',
    googleDriveWebViewLink: completed ? String(job?.googleDriveFile?.webViewLink || '').trim() : '',
    googleDriveUploaded: completed ? Boolean(job?.googleDriveFileId || job?.googleDriveFile?.id) : false,
    message: completed ? 'Migration completed in demo mode.' : 'Migration running in demo mode.',
    fallback_mode: true,
  }
}

function isOneOfPaths(pathname, candidates) {
  const path = normalizePathname(pathname)
  return candidates.includes(path)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const requestPath = normalizePathname(url.pathname)
    const upstreamApiOrigin = resolveApiUpstreamOrigin(env)
    const canonicalHost = resolveCanonicalHost(env)

    if (request.method === 'GET' && requestPath === '/__probe/env') {
      let upstreamHost = ''
      try {
        upstreamHost = upstreamApiOrigin ? new URL(upstreamApiOrigin).host : ''
      } catch {
        upstreamHost = ''
      }

      return jsonResponse({
        status: 200,
        data: {
          worker: 'project1-video-app',
          route_host: url.host,
          request_path: requestPath,
          has_api_upstream_origin: Boolean(upstreamApiOrigin),
          api_upstream_origin_host: upstreamHost,
          api_upstream_origin_scheme_https: String(upstreamApiOrigin || '').startsWith('https://'),
        },
      })
    }

    if (canonicalHost && url.hostname.endsWith('workers.dev') && !requestPath.startsWith('/api/v1/')) {
      const canonical = new URL(request.url)
      canonical.hostname = canonicalHost
      return Response.redirect(canonical.toString(), 302)
    }

    if (request.method === 'OPTIONS' && (requestPath.startsWith('/api/v1/') || requestPath.startsWith('/auth/'))) {
      return new Response(null, {
        status: 204,
        headers: buildJsonHeaders(),
      })
    }

    if (isApiPath(requestPath)) {
      if (upstreamApiOrigin) {
        return proxyApiRequestToUpstream(request, upstreamApiOrigin)
      }

      // Production safety: when running on a custom domain route and no explicit
      // upstream is configured, pass API calls through to the zone origin.
      // This prevents demo-mode API responses on production routes.
      if (!url.hostname.endsWith('workers.dev')) {
        return fetch(request)
      }
    }

    if (request.method === 'POST' && isOneOfPaths(requestPath, ['/api/v1/auth/register', '/auth/register'])) {
      const data = await parseBodyData(request)
      const rawName = String(data?.name || `${data?.first_name || ''} ${data?.last_name || ''}`)
      const [firstName, lastName] = toNameParts(rawName, 'User', 'User')
      const email = normalizeEmail(data?.email, firstName)

      return jsonResponse(buildDemoAuthBody({
        provider: 'general',
        firstName,
        lastName,
        email,
      }))
    }

    if (request.method === 'POST' && isOneOfPaths(requestPath, ['/api/v1/auth/login', '/auth/login'])) {
      const data = await parseBodyData(request)
      const email = normalizeEmail(data?.email, 'user')
      const [firstName, lastName] = toNameParts(email.split('@')[0], 'User', 'Account')

      return jsonResponse(buildDemoAuthBody({
        provider: 'general',
        firstName,
        lastName,
        email,
      }))
    }

    if (request.method === 'POST' && isOneOfPaths(requestPath, ['/api/v1/auth/oauth/callback', '/auth/oauth/callback'])) {
      const data = await parseBodyData(request)
      const provider = String(data?.provider || 'google').trim().toLowerCase() || 'google'

      // Real Google OAuth: exchange authorization code for tokens
      // The client secret is stored as a Workers secret (GOOGLE_CLIENT_SECRET)
      if (provider === 'google' && data?.code && env?.GOOGLE_CLIENT_SECRET) {
        try {
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              code: data.code,
              client_id: '989755989766-i7v8a6h95cou5bd9ab9li19mqi06guj1.apps.googleusercontent.com',
              client_secret: env.GOOGLE_CLIENT_SECRET,
              redirect_uri: String(data.redirect_uri || '').trim() || `https://${url.hostname}/auth/google/callback`,
              grant_type: 'authorization_code',
            }).toString(),
          })

          const tokenData = await tokenResponse.json()

          if (tokenData.access_token) {
            // Fetch user info from Google
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { Authorization: `Bearer ${tokenData.access_token}` },
            })
            const userInfo = await userInfoResponse.json()

            // Store the refresh token and access token with the user account
            const randomId = createRandomId()
            return jsonResponse({
              status: 200,
              data: {
                token: `google-oauth-token-${randomId}`,
                client_id: 'web_client',
                device: 'web-browser',
                os: 'web',
                user: {
                  uuid: `google-user-${randomId}`,
                  first_name: userInfo.given_name || 'Google',
                  last_name: userInfo.family_name || 'User',
                  email: userInfo.email || normalizeEmail(`${provider}.${Date.now()}`, provider),
                  registration_type: 'google',
                  active: 1,
                  color: null,
                  avatar: userInfo.picture || null,
                  google_access_token: tokenData.access_token,
                  google_refresh_token: tokenData.refresh_token || null,
                },
                google_access_token: tokenData.access_token,
                google_refresh_token: tokenData.refresh_token || null,
                google_drive_connected: true,
              },
            })
          }
          return jsonResponse({
            status: 400,
            error_description: [tokenData.error_description || tokenData.error || 'Google OAuth token exchange failed.'],
            message: 'Google OAuth token exchange failed.',
          }, 400)
        } catch (exchangeError) {
          console.error('Google OAuth token exchange failed:', exchangeError)
          return jsonResponse({
            status: 500,
            error_description: [String(exchangeError?.message || exchangeError || 'Google OAuth token exchange failed.')],
            message: 'Google OAuth token exchange failed.',
          }, 500)
        }
      }

      if (provider === 'google' && !env?.GOOGLE_CLIENT_SECRET) {
        return jsonResponse({
          status: 500,
          error_description: ['GOOGLE_CLIENT_SECRET is not configured on the Cloudflare Worker.'],
          message: 'Google OAuth is not configured for production.',
        }, 500)
      }

      // Non-Google providers: check for configured secrets
      if (provider === 'dropbox') {
        if (!env?.DROPBOX_CLIENT_SECRET) {
          return jsonResponse({
            status: 500,
            error_description: ['DROPBOX_CLIENT_SECRET is not configured on the Cloudflare Worker. Set it via `wrangler secret put DROPBOX_CLIENT_SECRET`.'],
            message: 'Dropbox OAuth is not configured for production.',
          }, 500)
        }
        // Dropbox OAuth token exchange
        try {
          const dropboxClientId = env?.DROPBOX_CLIENT_ID || ''
          const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              code: data.code,
              client_id: dropboxClientId,
              client_secret: env.DROPBOX_CLIENT_SECRET,
              redirect_uri: String(data.redirect_uri || '').trim() || `https://${url.hostname}/auth/dropbox/callback`,
              grant_type: 'authorization_code',
            }).toString(),
          })
          const tokenData = await tokenResponse.json()
          const randomId = createRandomId()
          return jsonResponse({
            status: 200,
            data: {
              token: `dropbox-oauth-token-${randomId}`,
              client_id: 'web_client',
              device: 'web-browser',
              os: 'web',
              user: {
                uuid: `dropbox-user-${randomId}`,
                first_name: 'Dropbox',
                last_name: 'User',
                email: normalizeEmail(`dropbox.${Date.now()}`, 'dropbox'),
                registration_type: 'dropbox',
                active: 1,
                color: null,
                dropbox_access_token: tokenData.access_token || '',
              },
              dropbox_access_token: tokenData.access_token || '',
              dropbox_connected: true,
            },
          })
        } catch (e) {
          return jsonResponse({
            status: 500,
            error_description: [String(e?.message || 'Dropbox OAuth token exchange failed.')],
            message: 'Dropbox OAuth token exchange failed.',
          }, 500)
        }
      }

      if (provider === 'facebook') {
        if (!env?.FACEBOOK_APP_SECRET) {
          return jsonResponse({
            status: 500,
            error_description: ['FACEBOOK_APP_SECRET is not configured on the Cloudflare Worker. Set it via `wrangler secret put FACEBOOK_APP_SECRET`.'],
            message: 'Facebook OAuth is not configured for production.',
          }, 500)
        }
        // Facebook OAuth token exchange
        try {
          const facebookAppId = env?.FACEBOOK_APP_ID || '4353526181633465'
          const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              code: data.code,
              client_id: facebookAppId,
              client_secret: env.FACEBOOK_APP_SECRET,
              redirect_uri: String(data.redirect_uri || '').trim() || `https://${url.hostname}/auth/facebook/callback`,
            }).toString(),
          })
          const tokenData = await tokenResponse.json()
          const randomId = createRandomId()
          return jsonResponse({
            status: 200,
            data: {
              token: `facebook-oauth-token-${randomId}`,
              client_id: 'web_client',
              device: 'web-browser',
              os: 'web',
              user: {
                uuid: `facebook-user-${randomId}`,
                first_name: 'Facebook',
                last_name: 'User',
                email: normalizeEmail(`facebook.${Date.now()}`, 'facebook'),
                registration_type: 'facebook',
                active: 1,
                color: null,
                facebook_access_token: tokenData.access_token || '',
              },
              facebook_access_token: tokenData.access_token || '',
              facebook_connected: true,
            },
          })
        } catch (e) {
          return jsonResponse({
            status: 500,
            error_description: [String(e?.message || 'Facebook OAuth token exchange failed.')],
            message: 'Facebook OAuth token exchange failed.',
          }, 500)
        }
      }

      // Fallback: provider not fully supported
      return jsonResponse({
        status: 400,
        error_description: [`Unsupported OAuth provider: ${provider}`],
        message: 'OAuth provider not supported.',
      }, 400)
    }

    if (request.method === 'GET' && isOneOfPaths(requestPath, ['/api/v1/users/me', '/users/me'])) {
      const token = String(request.headers.get('token') || '').trim()
      const tokenSuffix = token ? token.slice(-12) : createRandomId().slice(-12)

      return jsonResponse({
        status: 200,
        data: {
          uuid: `demo-user-${tokenSuffix}`,
          first_name: 'Demo',
          last_name: 'User',
          email: `demo.${tokenSuffix}@octopussol.local`,
          registration_type: 'general',
          active: 1,
          color: null,
        },
      })
    }

    if (request.method === 'GET' && isOneOfPaths(requestPath, ['/api/v1/tag', '/tag'])) {
      return jsonResponse({
        status: 200,
        data: {
          data: buildDemoTagList(),
        },
      })
    }

    if (request.method === 'GET' && requestPath.startsWith('/api/v1/oauth/')) {
      const providerId = requestPath.split('/').filter(Boolean).slice(-1)[0]
      return jsonResponse(buildProviderOAuthDemoPayload(providerId))
    }

    if (request.method === 'POST' && isOneOfPaths(requestPath, ['/api/v1/migration/validate', '/migration/validate'])) {
      const data = await parseBodyData(request)
      const sourceUrl = String(data?.sourceUrl || '').trim()
      const filename = inferFilenameFromSourceUrl(sourceUrl)
      const mime = inferVideoMimeType(filename)

      return jsonResponse({
        status: 200,
        data: {
          valid: true,
          size: 150 * 1024 * 1024,
          mime,
          filename,
          message: 'Validation passed in demo mode.',
          fallback_mode: true,
        },
      })
    }

    if (request.method === 'POST' && isOneOfPaths(requestPath, ['/api/v1/migration/start', '/migration/start'])) {
      const data = await parseBodyData(request)
      const provider = normalizeProviderId(data?.provider) || 'dropbox'
      const sourceUrl = String(data?.sourceUrl || '').trim()
      const sourceType = String(data?.sourceType || 'url').trim().toLowerCase()
      const metadata = data?.metadata && typeof data.metadata === 'object' ? data.metadata : {}
      const googleAccessToken = String(request.headers.get('x-google-access-token') || data?.googleAccessToken || data?.google_access_token || '').trim()
      const title = String(metadata?.title || inferFilenameFromSourceUrl(sourceUrl)).trim() || 'Imported video'
      const filename = inferFilenameFromSourceUrl(sourceUrl)
      let driveFile = null
      let playbackUrl = sourceType === 'account' ? normalizeLinkedAccountPlaybackUrl(sourceUrl) : ''

      if (sourceType === 'account' && provider === 'gdrive' && !googleAccessToken) {
        return jsonResponse({
          status: 401,
          error_description: ['Google Drive access token missing. Reconnect Google Drive, then start the import again.'],
          message: 'Google Drive access token missing.',
        }, 401)
      }

      if (sourceType === 'account' && provider === 'gdrive' && googleAccessToken && sourceUrl) {
        try {
          driveFile = await uploadSourceUrlToGoogleDrive({
            accessToken: googleAccessToken,
            sourceUrl,
            title,
            description: String(metadata?.description || '').trim(),
          })
          const driveFileId = String(driveFile?.id || extractGoogleDriveFileId(driveFile?.webViewLink) || '').trim()
          playbackUrl = buildGoogleDriveProxyPlaybackUrl(driveFileId, googleAccessToken) || playbackUrl
        } catch (driveError) {
          return jsonResponse({
            status: 502,
            error_description: [String(driveError?.message || driveError || 'Unable to upload video to Google Drive.')],
            message: 'Unable to upload video to Google Drive.',
          }, 502)
        }
      }

      const googleDriveFileId = String(driveFile?.id || '').trim()
      const migrationVideoId = googleDriveFileId || `migration-${createRandomId().slice(0, 8)}`

      const jobId = createRandomId()
      const job = {
        jobId,
        createdAt: Date.now(),
        provider,
        sourceUrl,
        sourceType,
        metadata,
        filename,
        playbackUrl,
        googleDriveFileId,
        googleDriveFile: driveFile || null,
        videoId: migrationVideoId,
      }

      demoMigrationJobs.set(jobId, job)

      return jsonResponse({
        status: 200,
        data: {
          jobId,
          progress: 1,
          stage: 'queued',
          completed: false,
          message: 'Migration started in demo mode.',
          fallback_mode: true,
        },
      })
    }

    if (request.method === 'POST' && isOneOfPaths(requestPath, ['/api/v1/storage/upload', '/storage/upload'])) {
      const provider = inferProviderFromUploadRequest(request)
      const filename = `upload-${Date.now()}.mp4`
      const videoId = `demo-video-${createRandomId().slice(0, 8)}`

      return jsonResponse({
        status: 200,
        data: {
          files: [
            {
              id: videoId,
              fileId: videoId,
              videoUuid: videoId,
              originalFilename: filename,
              filename,
              mimeType: inferVideoMimeType(filename),
              size: 24.5,
              // Intentionally empty in demo mode for local uploads so
              // the watch page uses local object URL passed by frontend.
              playbackUrl: '',
              provider,
            },
          ],
          fallback_mode: true,
          message: 'Storage upload completed in demo mode.',
        },
      })
    }

    if (
      request.method === 'GET'
      && (requestPath.startsWith('/api/v1/migration/status/') || requestPath.startsWith('/migration/status/'))
    ) {
      const jobId = decodeURIComponent(requestPath.split('/').filter(Boolean).slice(-1)[0] || '').trim()
      if (!jobId) {
        return jsonResponse({
          status: 400,
          error_description: ['jobId is required.'],
        }, 400)
      }

      const job = getOrCreateDemoMigrationJob(jobId)
      return jsonResponse({
        status: 200,
        data: buildDemoMigrationStatusPayload(job),
      })
    }

    if (request.method === 'GET') {
      const googleDriveStreamFileId = extractPathParam(requestPath, /^\/(?:api\/v1\/)?google-drive\/stream\/([^/]+)$/i)
      if (googleDriveStreamFileId) {
        const googleAccessToken = String(request.headers.get('x-google-access-token') || url.searchParams.get('google_access_token') || url.searchParams.get('access_token') || '').trim()
        const driveDownloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(googleDriveStreamFileId)}?alt=media`
        const headers = new Headers()
        const range = String(request.headers.get('range') || '').trim()
        if (range) headers.set('range', range)
        if (googleAccessToken) headers.set('authorization', `Bearer ${googleAccessToken}`)

        const driveResponse = await fetch(driveDownloadUrl, { headers })
        if (!driveResponse.ok) {
          return jsonResponse({
            status: driveResponse.status,
            error_description: ['Unable to stream Google Drive video. Reconnect Google Drive or check file permissions.'],
            message: 'Unable to stream Google Drive video.',
          }, driveResponse.status)
        }

        const responseHeaders = new Headers(driveResponse.headers)
        responseHeaders.set('access-control-allow-origin', '*')
        responseHeaders.set('accept-ranges', 'bytes')
        responseHeaders.set('cache-control', 'private, max-age=60')
        if (!responseHeaders.get('content-type')) responseHeaders.set('content-type', 'video/mp4')

        return new Response(driveResponse.body, {
          status: driveResponse.status,
          headers: responseHeaders,
        })
      }

      const streamUrlVideoId = extractPathParam(requestPath, /^\/(?:api\/v1\/)?videos\/([^/]+)\/stream-url$/i)
      if (streamUrlVideoId) {
        return jsonResponse({
          status: 200,
          data: {
            videoId: streamUrlVideoId,
            streamUrl: DEMO_MIGRATION_STREAM_URL,
            playbackUrl: DEMO_MIGRATION_STREAM_URL,
            message: 'Using demo playback stream URL.',
            fallback_mode: true,
          },
        })
      }

      const migrationStreamVideoId = extractPathParam(requestPath, /^\/(?:api\/v1\/)?video\/migration\/stream\/([^/]+)$/i)
      if (migrationStreamVideoId) {
        return Response.redirect(DEMO_MIGRATION_STREAM_URL, 302)
      }
    }

    if (request.method === 'GET' && isOneOfPaths(requestPath, ['/api/v1/user/tag', '/user/tag'])) {
      return jsonResponse({
        status: 200,
        data: {
          data: [],
        },
      })
    }

    if (request.method === 'POST' && isOneOfPaths(requestPath, ['/api/v1/user/tag', '/user/tag'])) {
      return jsonResponse({
        status: 200,
        data: {
          message: 'Tag added successfully',
        },
      })
    }

    if (request.method === 'POST' && isOneOfPaths(requestPath, ['/api/v1/user/tag/custom', '/user/tag/custom'])) {
      return jsonResponse({
        status: 200,
        data: {
          message: 'Custom tag added successfully',
        },
      })
    }

    if (request.method === 'DELETE' && requestPath.startsWith('/api/v1/user/tag/')) {
      return jsonResponse({
        status: 200,
        data: {
          message: 'Tag removed successfully',
        },
      })
    }

    if ((request.method === 'PUT' || request.method === 'PATCH') && isOneOfPaths(requestPath, ['/api/v1/users', '/users'])) {
      return jsonResponse({
        status: 200,
        data: {
          message: 'Profile updated successfully',
        },
      })
    }

    if (request.method === 'POST' && isOneOfPaths(requestPath, ['/api/v1/video/link', '/video/link', '/api/v1/video', '/video'])) {
      const data = await parseBodyData(request)
      const now = new Date().toISOString()
      const videoId = `posted-video-${createRandomId()}`
      const sourceUrl = String(data?.url || data?.source_url || data?.video_url || '').trim()
      const title = String(data?.name || data?.title || inferFilenameFromSourceUrl(sourceUrl)).trim() || 'Imported video'
      const privacy = String(data?.privacy_option_id || data?.privacy || 'public').trim()
      const googleAccessToken = String(request.headers.get('x-google-access-token') || '').trim()
      let driveFile = null

      if (googleAccessToken && sourceUrl) {
        try {
          driveFile = await uploadSourceUrlToGoogleDrive({
            accessToken: googleAccessToken,
            sourceUrl,
            title,
            description: String(data?.description || '').trim(),
          })
        } catch (driveError) {
          return jsonResponse({
            status: 502,
            error_description: [String(driveError?.message || driveError || 'Unable to store video on Google Drive.')],
            message: 'Unable to store video on Google Drive.',
          }, 502)
        }
      }

      const driveFileId = String(driveFile?.id || extractGoogleDriveFileId(driveFile?.webViewLink) || '').trim()
      const finalSourceUrl = buildGoogleDriveProxyPlaybackUrl(driveFileId, googleAccessToken) || String(driveFile?.webViewLink || driveFile?.webContentLink || sourceUrl).trim()
      const video = {
        uuid: videoId,
        id: videoId,
        name: title,
        title,
        type: String(data?.type || data?.source_platform || 'Google Drive').trim(),
        url: finalSourceUrl,
        source_url: finalSourceUrl,
        video_url: finalSourceUrl,
        google_drive_file_id: String(driveFile?.id || '').trim(),
        google_drive_file: driveFile || null,
        description: String(data?.description || '').trim(),
        discussion_link: String(data?.discussion_link || '').trim(),
        privacy_option: privacy,
        privacyOption: { data: { name: privacy.charAt(0).toUpperCase() + privacy.slice(1) } },
        channel_name: 'My Channel',
        channel: { name: 'My Channel', data: { name: 'My Channel' } },
        created_at: now,
        updated_at: now,
      }

      savePostedVideoForRequest(request, video)

      return jsonResponse({
        status: 200,
        data: video,
        message: 'Video posted successfully.',
      })
    }

    if (request.method === 'GET' && isOneOfPaths(requestPath, ['/api/v1/video/me', '/video/me'])) {
      return jsonResponse({
        status: 200,
        data: {
          data: getPostedVideosForRequest(request),
        },
      })
    }

    // Connected Accounts - list videos from a connected platform
    if (request.method === 'GET' && /^\/api\/v1\/accounts\/(google|facebook|dropbox|gdrive)\/videos/i.test(requestPath)) {
      const providerMatch = requestPath.match(/\/accounts\/([^/]+)\/videos/i)
      const provider = providerMatch ? providerMatch[1].toLowerCase() : ''

      if (provider === 'google' || provider === 'gdrive') {
        const googleAccessToken = String(request.headers.get('x-google-access-token') || '').trim()

        if (!googleAccessToken) {
          return jsonResponse({
            status: 401,
            error_description: ['Google Drive is connected, but no Google access token was provided. Please reconnect Google Drive.'],
            message: 'Google Drive access token missing.',
          }, 401)
        }

        const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('per_page') || 20)))
        const pageToken = String(url.searchParams.get('page_token') || '').trim()
        const driveUrl = new URL('https://www.googleapis.com/drive/v3/files')
        driveUrl.searchParams.set('q', "mimeType contains 'video/' and trashed = false")
        driveUrl.searchParams.set('pageSize', String(pageSize))
        driveUrl.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,size)')
        driveUrl.searchParams.set('orderBy', 'modifiedTime desc')
        if (pageToken) {
          driveUrl.searchParams.set('pageToken', pageToken)
        }

        const driveResponse = await fetch(driveUrl.toString(), {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        })
        const drivePayload = await driveResponse.json().catch(() => ({}))

        if (!driveResponse.ok) {
          return jsonResponse({
            status: driveResponse.status,
            error_description: [drivePayload?.error?.message || 'Unable to fetch Google Drive videos. Please reconnect Google Drive.'],
            message: 'Unable to fetch Google Drive videos.',
          }, driveResponse.status)
        }

        const videos = Array.isArray(drivePayload.files)
          ? drivePayload.files.map(normalizeGoogleDriveVideo)
          : []

        return jsonResponse({
          status: 200,
          data: {
            videos,
            total: videos.length,
            page: Number(url.searchParams.get('page') || 1),
            perPage: pageSize,
            hasMore: Boolean(drivePayload.nextPageToken),
            nextPageToken: drivePayload.nextPageToken || '',
            fallback_mode: false,
          },
        })
      }

      // Return demo video data for the provider (in demo mode only)
      const demoVideos = {
        google: [
          { id: 'gdrive-demo-1', title: 'My Google Drive Presentation', url: 'https://drive.google.com/file/d/demo1/view', thumbnail: '', duration: '12:34', publishedAt: '2026-05-15' },
          { id: 'gdrive-demo-2', title: 'Project Demo Recording', url: 'https://drive.google.com/file/d/demo2/view', thumbnail: '', duration: '8:21', publishedAt: '2026-05-10' },
          { id: 'gdrive-demo-3', title: 'Team Meeting Notes', url: 'https://drive.google.com/file/d/demo3/view', thumbnail: '', duration: '45:00', publishedAt: '2026-04-28' },
        ],
        gdrive: [
          { id: 'gdrive-demo-1', title: 'My Google Drive Presentation', url: 'https://drive.google.com/file/d/demo1/view', thumbnail: '', duration: '12:34', publishedAt: '2026-05-15' },
          { id: 'gdrive-demo-2', title: 'Project Demo Recording', url: 'https://drive.google.com/file/d/demo2/view', thumbnail: '', duration: '8:21', publishedAt: '2026-05-10' },
          { id: 'gdrive-demo-3', title: 'Team Meeting Notes', url: 'https://drive.google.com/file/d/demo3/view', thumbnail: '', duration: '45:00', publishedAt: '2026-04-28' },
        ],
        facebook: [
          { id: 'fb-demo-1', title: 'Live Stream Recording', url: 'https://facebook.com/watch/?v=demo1', thumbnail: '', duration: '1:23:45', publishedAt: '2026-06-01' },
          { id: 'fb-demo-2', title: 'Product Launch Video', url: 'https://facebook.com/watch/?v=demo2', thumbnail: '', duration: '15:30', publishedAt: '2026-05-20' },
        ],
        dropbox: [
          { id: 'dbx-demo-1', title: 'Tutorial Screencast', url: 'https://dropbox.com/s/demo1/video.mp4', thumbnail: '', duration: '22:15', publishedAt: '2026-06-05' },
          { id: 'dbx-demo-2', title: 'Event Highlights', url: 'https://dropbox.com/s/demo2/video.mp4', thumbnail: '', duration: '5:45', publishedAt: '2026-05-30' },
          { id: 'dbx-demo-3', title: 'Course Introduction', url: 'https://dropbox.com/s/demo3/video.mp4', thumbnail: '', duration: '10:00', publishedAt: '2026-05-25' },
          { id: 'dbx-demo-4', title: 'Behind the Scenes', url: 'https://dropbox.com/s/demo4/video.mp4', thumbnail: '', duration: '3:20', publishedAt: '2026-05-18' },
        ],
      }

      // Require access token for non-Google providers in production
      if (provider === 'facebook' && !env?.FACEBOOK_APP_SECRET) {
        return jsonResponse({
          status: 401,
          error_description: ['Facebook OAuth is not configured. FACEBOOK_APP_SECRET is required for production.'],
          message: 'Facebook OAuth not configured.',
        }, 401)
      }

      if (provider === 'dropbox' && !env?.DROPBOX_CLIENT_SECRET) {
        return jsonResponse({
          status: 401,
          error_description: ['Dropbox OAuth is not configured. DROPBOX_CLIENT_SECRET is required for production.'],
          message: 'Dropbox OAuth not configured.',
        }, 401)
      }

      const videos = demoVideos[provider] || demoVideos.google
      
      return jsonResponse({
        status: 200,
        data: {
          videos,
          total: videos.length,
          page: 1,
          perPage: 20,
          hasMore: false,
          fallback_mode: true,
        },
      })
    }

    if (requestPath.startsWith('/api/v1/')) {
      return jsonResponse({
        status: 200,
        data: {
          data: [],
          message: 'Demo API fallback response',
          fallback_mode: true,
        },
      })
    }

    // OAuth callback page - serves HTML that the popup window loads
    // The popup listener in auth.service.js detects the URL change and extracts the code
    if (request.method === 'GET' && /^\/(?:api\/v1\/)?auth\/(google|facebook|dropbox)\/callback$/i.test(requestPath)) {
      const callbackHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Completing login...</title>
  <style>
    body { font-family: sans-serif; text-align: center; padding: 50px; background: #1a1a2e; color: #fff; }
    p { color: #aaa; }
  </style>
</head>
<body>
  <p>Completing login...</p>
  <script>
    // Notify the opener window with the OAuth callback params
    if (window.opener) {
      window.opener.postMessage({
        type: 'oauth-callback',
        url: window.location.href
      }, '*')
    }
    // Close this popup after a short delay
    setTimeout(function() { window.close(); }, 100);
  </script>
</body>
</html>`
      return new Response(callbackHtml, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    }

    if (request.method === 'GET' && requestPath.toLowerCase() === '/privacy_policy.md') {
      const canonicalPrivacyPageUrl = new URL('/privacy-policy.html', url)
      return Response.redirect(canonicalPrivacyPageUrl.toString(), 301)
    }

    const assetResponse = await env.ASSETS.fetch(request)
    const assetHeaders = new Headers(assetResponse.headers)
    const contentType = String(assetHeaders.get('content-type') || '').toLowerCase()
    if (contentType.includes('text/html')) {
      assetHeaders.set('cache-control', 'no-store, max-age=0')
    }

    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers: assetHeaders,
    })
  },
}






