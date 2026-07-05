import axios from 'axios'
import { API_CONFIG, clearAuthTokens } from '../config/api.config'

const API_BASE_URL = String(API_CONFIG?.baseURL || '').trim()

const AUTH_TOKEN_KEY = 'auth_token'
const IS_DEV = import.meta.env.DEV
const DEFAULT_API_TIMEOUT_MS = 30000
const LONG_RUNNING_VIDEO_TIMEOUT_MS = 10 * 60 * 1000

// Log API configuration on init
if (IS_DEV && typeof window !== 'undefined') {
  console.log('🔧 Axios Client Config:', {
    baseURL: API_BASE_URL,
    timeout: LONG_RUNNING_VIDEO_TIMEOUT_MS,
    env: import.meta.env.MODE,
  })
}

function getAuthToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('token') || null
}

function emitUnauthorizedEvent() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent('auth:unauthorized'))
}

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_API_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
  },
})

axiosClient.interceptors.request.use(
  (config) => {
    const nextConfig = { ...config }
    const token = getAuthToken()

    nextConfig.headers = nextConfig.headers || {}

    if (token) {
      nextConfig.headers.Authorization = `Bearer ${token}`
    }

    const requestUrl = String(nextConfig.url || '').toLowerCase()
    const longRunningVideoEndpoints = ['/migration/start', '/storage/upload', '/video/link', '/api/v1/migration/start', '/api/v1/storage/upload', '/api/v1/video/link']
    if (longRunningVideoEndpoints.some((endpoint) => requestUrl.includes(endpoint))) {
      nextConfig.timeout = Math.max(Number(nextConfig.timeout || 0), LONG_RUNNING_VIDEO_TIMEOUT_MS)
    }

    const isMultipartBody =
      typeof FormData !== 'undefined' && nextConfig.data instanceof FormData

    if (isMultipartBody) {
      // Do not force multipart content-type so browser can include proper boundary.
      delete nextConfig.headers['Content-Type']
      delete nextConfig.headers['content-type']
    } else if (!nextConfig.headers['Content-Type'] && !nextConfig.headers['content-type']) {
      nextConfig.headers['Content-Type'] = 'application/json'
    }

    if (IS_DEV) {
      console.debug('[upload-debug] request', {
        method: nextConfig.method,
        baseURL: nextConfig.baseURL,
        url: nextConfig.url,
        hasAuthToken: Boolean(token),
        isMultipartBody,
        timeout: nextConfig.timeout,
      })
    }

    return nextConfig
  },
  (error) => Promise.reject(error)
)

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (IS_DEV) {
      console.error('[upload-debug] response-error', {
        status: error?.response?.status,
        url: error?.config?.url,
        message: error?.message,
        data: error?.response?.data,
        code: error?.code, // Will show 'ECONNABORTED' for timeout
      })
    }

    // Handle timeout explicitly
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      console.error('⏱️ API Request Timeout - Backend may not be running or is too slow')
    }

    if (error?.response?.status === 401) {
      clearAuthTokens()
      emitUnauthorizedEvent()
    }

    return Promise.reject(error)
  }
)

export default axiosClient
