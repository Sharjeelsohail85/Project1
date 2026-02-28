import axios from 'axios'
import { API_CONFIG, clearAuthTokens } from '../config/api.config'

const API_BASE_URL = String(API_CONFIG?.baseURL || '').trim()

const AUTH_TOKEN_KEY = 'auth_token'
const IS_DEV = import.meta.env.DEV

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
  timeout: 30000,
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
      })
    }

    if (error?.response?.status === 401) {
      clearAuthTokens()
      emitUnauthorizedEvent()
    }

    return Promise.reject(error)
  }
)

export default axiosClient
