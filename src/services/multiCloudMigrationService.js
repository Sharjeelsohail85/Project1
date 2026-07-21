export async function beginProviderOAuth(providerId) {
  return { authUrl: '#', state: 'demo-state' }
}

export async function waitForProviderOAuthResult(state) {
  return { success: true, token: 'demo-token' }
}
