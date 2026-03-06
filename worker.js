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
    'access-control-allow-headers': 'content-type, token, client_id, authorization',
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
const DEMO_MIGRATION_STREAM_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

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
          worker: 'octopussol',
          route_host: url.host,
          request_path: requestPath,
          has_api_upstream_origin: Boolean(upstreamApiOrigin),
          api_upstream_origin_host: upstreamHost,
          api_upstream_origin_scheme_https: String(upstreamApiOrigin || '').startsWith('https://'),
        },
      })
    }

    if (url.hostname.endsWith('workers.dev') && !requestPath.startsWith('/api/v1/')) {
      const canonical = new URL(request.url)
      canonical.hostname = 'octopussol.com'
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

      // For workers.dev preview URLs, fail fast instead of returning demo API
      // payloads when upstream is not configured.
      return jsonResponse({
        status: 503,
        error_description: [
          'API upstream is not configured for this worker preview URL.',
        ],
        message: 'Configure API_UPSTREAM_ORIGIN or use the custom domain route.',
      }, 503)
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
      const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1)
      const email = normalizeEmail(`${provider}.${Date.now()}`, provider)

      return jsonResponse(buildDemoAuthBody({
        provider,
        firstName: providerLabel,
        lastName: 'User',
        email,
      }))
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
      const metadata = data?.metadata && typeof data.metadata === 'object' ? data.metadata : {}
      const filename = inferFilenameFromSourceUrl(sourceUrl)

      const jobId = createRandomId()
      const job = {
        jobId,
        createdAt: Date.now(),
        provider,
        sourceUrl,
        metadata,
        filename,
        videoId: `demo-video-${createRandomId().slice(0, 8)}`,
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

    if (request.method === 'GET' && requestPath.startsWith('/api/v1/video')) {
      return jsonResponse({
        status: 200,
        data: {
          data: [],
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

    if (request.method === 'GET' && requestPath.toLowerCase() === '/privacy_policy.md') {
      const canonicalPrivacyPageUrl = new URL('/privacy-policy.html', url)
      return Response.redirect(canonicalPrivacyPageUrl.toString(), 301)
    }

    return env.ASSETS.fetch(request)
  },
}

