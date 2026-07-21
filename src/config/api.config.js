export function getAuthTokens() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const token = localStorage.getItem('auth_token')
    return token ? { token } : null
  } catch {
    return null
  }
}

export function saveAuthTokens(tokens) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    if (tokens?.token) {
      localStorage.setItem('auth_token', tokens.token)
    }
  } catch {
    // no-op
  }
}

export function clearAuthTokens() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    localStorage.removeItem('auth_token')
  } catch {
    // no-op
  }
}
