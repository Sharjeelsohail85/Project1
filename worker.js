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

function buildDemoTagList() {
  return [
    { uuid: 'demo-tag-1', name: 'Music', active: 1 },
    { uuid: 'demo-tag-2', name: 'Gaming', active: 1 },
    { uuid: 'demo-tag-3', name: 'Technology', active: 1 },
    { uuid: 'demo-tag-4', name: 'Sports', active: 1 },
    { uuid: 'demo-tag-5', name: 'Education', active: 1 },
  ]
}

function isOneOfPaths(pathname, candidates) {
  const path = normalizePathname(pathname)
  return candidates.includes(path)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const requestPath = normalizePathname(url.pathname)

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

    return env.ASSETS.fetch(request)
  },
}

