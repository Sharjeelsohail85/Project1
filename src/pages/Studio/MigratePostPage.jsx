import { memo, useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import MigrationForm from '../../components/migration/MigrationForm'
import { storageProviders } from '../../config/storageProviders'
import { beginProviderOAuth, waitForProviderOAuthResult } from '../../services/multiCloudMigrationService'
import { videoAPI } from '../../services/api.service'

function hasAuthSession() {
  if (typeof window === 'undefined') return false
  const token = String(localStorage.getItem('token') || localStorage.getItem('auth_token') || '').trim()
  const clientId = String(localStorage.getItem('client_id') || '').trim()
  return Boolean(token && clientId)
}

function extractProviderMessage(error, fallback) {
  const payload = error?.response?.data || {}
  const descriptions = payload?.error_description
  if (Array.isArray(descriptions) && descriptions.length) {
    return descriptions.map((item) => String(item || '').trim()).filter(Boolean).join(' ')
  }

  const message = String(payload?.message || '').trim()
  if (message && message !== 'dashboard.success' && message !== 'dashboard.errors') {
    return message
  }

  const direct = String(error?.message || '').trim()
  if (direct) return direct
  return fallback
}

function normalizeConnectedProviderIds(connectedMap) {
  return Object.entries(connectedMap)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => String(key || '').trim().toLowerCase())
    .filter(Boolean)
}

const MigratePostPage = memo(function MigratePostPage() {
  const navigate = useNavigate()
  const [connectionError, setConnectionError] = useState('')
  const [connectionInfo, setConnectionInfo] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedById, setConnectedById] = useState(() => {
    const defaults = {}
    ;(Array.isArray(storageProviders) ? storageProviders : []).forEach((provider) => {
      const id = String(provider?.id || '').trim().toLowerCase()
      if (id) {
        defaults[id] = false
      }
    })
    return defaults
  })

  const connectedProviders = useMemo(() => normalizeConnectedProviderIds(connectedById), [connectedById])

  const onConnectProvider = useCallback(async (providerId) => {
    const normalized = String(providerId || '').trim().toLowerCase()
    if (!normalized) {
      setConnectionError('Provider id is required.')
      return
    }

    if (normalized === 's3') {
      setConnectedById((prev) => ({ ...prev, s3: true }))
      setConnectionInfo('Custom S3 selected. Ensure server S3 credentials are configured before starting migration.')
      setConnectionError('')
      return
    }

    if (!hasAuthSession()) {
      setConnectionError('Please login first. Missing token/client_id for provider connection.')
      return
    }

    setIsConnecting(true)
    setConnectionError('')
    setConnectionInfo('')

    try {
      const provider = (Array.isArray(storageProviders) ? storageProviders : []).find((item) => String(item?.id || '').trim().toLowerCase() === normalized)
      if (provider?.backendSupported === false) {
        setConnectionError(`${provider.name || normalized} is not available yet in backend.`)
        setConnectedById((prev) => ({ ...prev, [normalized]: false }))
        return
      }

      const result = await beginProviderOAuth(normalized)

      if (result?.requiresOAuthWindow && result?.oauthUrl) {
        const popup = window.open(String(result.oauthUrl), `${normalized}-oauth`, 'width=560,height=720')
        if (!popup) {
          setConnectionError(`Popup blocked for ${provider?.name || normalized}. Please allow popups and try again.`)
          return
        }

        const oauthResult = await waitForProviderOAuthResult()
        const oauthMessage = String(oauthResult?.message || '').trim()

        if (!oauthMessage) {
          setConnectionInfo(`${provider?.name || normalized} connected.`)
        } else {
          setConnectionInfo(oauthMessage)
        }

        setConnectedById((prev) => ({ ...prev, [normalized]: true }))
        setConnectionError('')
        return
      }

      if (!result?.connected) {
        setConnectedById((prev) => ({ ...prev, [normalized]: false }))
        setConnectionError(String(result?.message || `${provider?.name || normalized} is not configured for this account.`))
        return
      }

      setConnectedById((prev) => ({ ...prev, [normalized]: true }))
      setConnectionInfo(String(result?.message || `${provider?.name || normalized} connected.`))
    } catch (error) {
      setConnectedById((prev) => ({ ...prev, [normalized]: false }))
      setConnectionError(extractProviderMessage(error, `Failed to connect ${normalized}`))
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const onMigrationComplete = useCallback(({ videoId } = {}) => {
    const resolvedVideoId = String(videoId || '').trim()
    if (!resolvedVideoId) {
      return
    }

    videoAPI.streamUrl(resolvedVideoId)
      .then((response) => {
        const payload = response?.data || response || {}
        const streamUrl = String(payload?.streamUrl || payload?.playbackUrl || '').trim()

        if (!streamUrl) {
          navigate(`/watch/${encodeURIComponent(resolvedVideoId)}`)
          return
        }

        navigate(`/watch/${encodeURIComponent(resolvedVideoId)}?src=${encodeURIComponent(streamUrl)}`)
      })
      .catch(() => {
        navigate(`/watch/${encodeURIComponent(resolvedVideoId)}`)
      })
  }, [navigate])

  return (
    <section className="post-page-shell" aria-label="Studio migration post page">
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Studio / Migrate
            </Typography>

            <Button
              variant="text"
              onClick={() => navigate('/')}
              sx={{ textTransform: 'none' }}
            >
              Back to Home
            </Button>
          </Box>

          {isConnecting ? <Alert severity="info">Connecting provider...</Alert> : null}
          {connectionInfo ? <Alert severity="success">{connectionInfo}</Alert> : null}
          {connectionError ? <Alert severity="error">{connectionError}</Alert> : null}

          <MigrationForm
            connectedProviders={connectedProviders}
            onConnectProvider={onConnectProvider}
            onMigrationComplete={onMigrationComplete}
          />
        </Stack>
      </Container>
    </section>
  )
})

export default MigratePostPage

