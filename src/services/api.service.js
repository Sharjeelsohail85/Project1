export async function apiRequest(endpoint, options = {}) {
  try {
    const res = await fetch(endpoint, options)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    return { error: err.message }
  }
}

export const authAPI = {
  login: async (credentials) => {
    return { data: { token: 'demo-token', user: { name: 'Demo Creator', email: credentials?.email || 'creator@example.com' } } }
  },
  register: async (data) => {
    return { data: { token: 'demo-token', user: { name: data?.name || 'New Creator', email: data?.email } } }
  },
  me: async () => {
    return { data: { name: 'Demo Creator', email: 'creator@example.com', subscriber_count: 304 } }
  },
  logout: async () => {
    return { success: true }
  },
  googleCallback: async () => {
    return { data: { token: 'demo-google-token', user: { name: 'Google Creator', email: 'google@example.com' } } }
  },
  facebookCallback: async () => {
    return { data: { token: 'demo-fb-token', user: { name: 'Facebook Creator', email: 'fb@example.com' } } }
  },
  dropboxCallback: async () => {
    return { data: { token: 'demo-dropbox-token', user: { name: 'Dropbox Creator', email: 'dropbox@example.com' } } }
  }
}

export const videoAPI = {
  my: async () => {
    return { data: [] }
  },
  all: async () => {
    return { data: [] }
  },
  upload: async (formData) => {
    return { success: true, message: 'Uploaded successfully' }
  }
}
