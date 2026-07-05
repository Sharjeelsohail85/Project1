import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function stripTrailingSlash(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function resolveProxyTarget(apiBaseUrl) {
  try {
    const parsed = new URL(stripTrailingSlash(apiBaseUrl))
    return parsed.origin
  } catch {
    return 'http://localhost:8000'
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
  const proxyTarget = resolveProxyTarget(apiBaseUrl)

  return {
    plugins: [react()],
    root: '.',
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: 'index.html',
      },
    },
  }
})
