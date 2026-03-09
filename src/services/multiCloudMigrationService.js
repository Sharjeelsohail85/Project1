import apiClient from '../lib/apiClient'

function requireAuthParams() {
  if (typeof window === 'undefined') {
    throw new Error('Provider connection requires an authenticated browser session.')
  }

  const token = String(localStorage.getItem('token') || localStorage.getItem('auth_token') || '').trim()
  const clientId = String(localStorage.getItem('client_id') || '').trim()

  const normalizedToken = token.toLowerCase()
  const isDemoToken = normalizedToken.includes('demo-token') || normalizedToken.startsWith('oauth-demo-token-')
  if (isDemoToken) {
    throw new Error('Session is using demo token. Please sign in again to establish a real backend session.')
  }

  if (!token || !clientId) {
    throw new Error('Please login first. Missing token/client_id for provider connection.')
  }

  return {
    token,
    client_id: clientId,
  }
}

function getApiErrorMessage(error, fallback) {
  const payload = error?.response?.data || {}
  const fromDescription = Array.isArray(payload?.error_description)
    ? payload.error_description.map((item) => String(item || '').trim()).filter(Boolean).join(' ')
    : ''
  const fromMessage = String(payload?.message || '').trim()
  const direct = String(error?.message || '').trim()

  return fromDescription || fromMessage || direct || fallback
}

export async function beginProviderOAuth(providerId) {
  const normalizedProvider = String(providerId || '').trim().toLowerCase()
  if (!normalizedProvider) {
    throw new Error('Provider id is required.')
  }

  const auth = requireAuthParams()

  try {
    const response = await apiClient.get(`/oauth/${encodeURIComponent(normalizedProvider)}`, {
      params: {
        ...auth,
      },
    })

    const payload = response?.data?.data || response?.data || {}
    const statusCode = Number(payload?.status || 0)
    const errorDescriptions = Array.isArray(payload?.error_description)
      ? payload.error_description.map((item) => String(item || '').trim()).filter(Boolean)
      : []

    if (statusCode >= 400 || errorDescriptions.length) {
      const description = errorDescriptions.join(' ').trim()
      const fallback = String(payload?.message || 'Provider connection failed.').trim()
      throw new Error(description || fallback)
    }

    return {
      provider: String(payload?.provider || normalizedProvider),
      displayName: String(payload?.displayName || normalizedProvider),
      connected: Boolean(payload?.connected),
      requiresSetup: Boolean(payload?.requiresSetup),
      requiresOAuthWindow: Boolean(payload?.requiresOAuthWindow),
      missingFields: Array.isArray(payload?.missingFields) ? payload.missingFields : [],
      oauthUrl: String(payload?.oauthUrl || '').trim(),
      authUrl: String(payload?.authUrl || '').trim(),
      message: String(payload?.message || '').trim(),
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, `Failed to connect ${normalizedProvider}.`))
  }
}

export function waitForProviderOAuthResult({ timeoutMs = 180000 } = {}) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('OAuth result listener requires a browser environment.'))
  }

  return new Promise((resolve, reject) => {
    let finished = false
    let timeoutId = null

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      window.removeEventListener('message', onMessage)
    }

    const resolveOnce = (payload) => {
      if (finished) return
      finished = true
      cleanup()
      resolve(payload)
    }

    const rejectOnce = (error) => {
      if (finished) return
      finished = true
      cleanup()
      reject(error)
    }

    const onMessage = (event) => {
      const data = event?.data || {}
      if (data?.type !== 'provider-oauth-result') {
        return
      }

      const success = Boolean(data?.success)
      const message = String(data?.message || '').trim()
      const payload = data?.payload && typeof data.payload === 'object' ? data.payload : {}

      if (!success) {
        rejectOnce(new Error(message || 'Provider OAuth failed.'))
        return
      }

      resolveOnce({
        success,
        message,
        payload,
      })
    }

    window.addEventListener('message', onMessage)
    timeoutId = setTimeout(() => {
      rejectOnce(new Error('Provider OAuth timed out. Please try connecting again.'))
    }, Math.max(1000, Number(timeoutMs) || 180000))
  })
}

export default {
  beginProviderOAuth,
  waitForProviderOAuthResult,
}
