import apiClient from '../lib/apiClient'

function requireAuthParams() {
  if (typeof window === 'undefined') {
    throw new Error('Provider connection requires an authenticated browser session.')
  }

  const token = String(localStorage.getItem('token') || localStorage.getItem('auth_token') || '').trim()
  const clientId = String(localStorage.getItem('client_id') || '').trim()

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

export default {
  beginProviderOAuth,
}
