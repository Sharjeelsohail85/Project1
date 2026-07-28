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
import { saveLocalChannelVideo } from '../../services/videoService'
import { connectAccount, getConnectedAccounts, saveConnectedAccounts } from '../../services/linkedAccountService'

function getGoogleOAuthClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || '989755989766-i7v8a6h95cou5bd9ab9li19mqi06guj1.apps.googleusercontent.com'
}

function connectGoogleDriveWithImplicitToken() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Drive connect is only available in a browser.'))
      return
    }

    const state = Math.random().toString(36).slice(2) + Date.now().toString(36)
    const redirectUri = `${window.location.origin}/auth/google/callback`
    const params = new URLSearchParams({
      client_id: getGoogleOAuthClientId(),
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: 'openid profile email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly',
      prompt: 'consent',
      state,
    })

    const popup = window.open(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, 'google-drive-token', 'width=560,height=720')
    if (!popup) {
      reject(new Error('Popup blocked for Google Drive. Please allow popups and try again.'))
      return
    }

    const cleanup = () => {
      window.removeEventListener('message', onMessage)
      clearInterval(timer)
    }

    const finish = (callbackUrl) => {
      const parsed = new URL(callbackUrl)
      const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''))
      const search = new URLSearchParams(parsed.search)
      const accessToken = String(hash.get('access_token') || search.get('access_token') || '').trim()
      const error = String(hash.get('error') || search.get('error') || '').trim()
      if (error) throw new Error(`Google OAuth error: ${error}`)
      if (!accessToken) throw new Error('Google did not return an upload token.')

      const user = {
        uuid: `google-drive-${Date.now()}`,
        first_name: 'Google',
        last_name: 'Drive',
        email: 'google.drive@connected.local',
        registration_type: 'google',
        active: 1,
        google_access_token: accessToken,
      }
      localStorage.setItem('user_info', JSON.stringify(user))
      localStorage.setItem('connected_accounts', JSON.stringify([{ provider: 'google', connected: true, user }]))
      resolve(user)
    }

    function onMessage(event) {
      if (event.data?.type !== 'oauth-callback' || !event.data?.url) return
      try {
        finish(event.data.url)
        cleanup()
        popup.close()
      } catch (error) {
        cleanup()
        popup.close()
        reject(error)
      }
    }

    window.addEventListener('message', onMessage)
    const timer = setInterval(() => {
      try {
        if (popup.closed) {
          cleanup()
          reject(new Error('Google Drive popup closed before connection completed.'))
          return
        }
        const href = popup.location.href
        if (href && href.includes('/auth/google/callback')) {
          finish(href)
          cleanup()
          popup.close()
        }
      } catch {
        // ignore cross-origin until callback
      }
    }, 250)
  })
}

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
  const [showDropboxTokenInput, setShowDropboxTokenInput] = useState(false)
  const [dropboxTokenValue, setDropboxTokenValue] = useState('')
  const [connectedById, setConnectedById] = useState(() => {
    const defaults = {}
    ;(Array.isArray(storageProviders) ? storageProviders : []).forEach((provider) => {
      const id = String(provider?.id || '').trim().toLowerCase()
      if (id) {
        defaults[id] = false
      }
    })
    try {
      const accounts = getConnectedAccounts()
      accounts.forEach((acc) => {
        const id = String(acc?.provider || '').trim().toLowerCase()
        if (id === 'google') {
          defaults['gdrive'] = Boolean(acc.connected)
        } else if (id) {
          defaults[id] = Boolean(acc.connected)
        }
      })
    } catch {
      // ignore
    }
    return defaults
  })

  const connectedProviders = useMemo(() => normalizeConnectedProviderIds(connectedById), [connectedById])

  const onConnectProvider = useCallback(async (providerId, manualToken = '') => {
    const normalized = String(providerId || '').trim().toLowerCase()
    if (!normalized) {
      setConnectionError('Provider id is required.')
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
      if (normalized === 'gdrive') {
        const accounts = await connectGoogleDriveWithImplicitToken().then((user) => [{ provider: 'google', connected: true, user }]).catch(async () => connectAccount('google'))
        const googleAccount = Array.isArray(accounts)
          ? accounts.find((account) => {
            const providerName = String(account?.provider || '').toLowerCase()
            return account?.connected && ['google', 'gdrive', 'googledrive', 'google-drive'].includes(providerName)
          })
          : null
        const googleToken = String(
          googleAccount?.user?.google_access_token
            || googleAccount?.user?.googleAccessToken
            || googleAccount?.google_access_token
            || googleAccount?.googleAccessToken
            || '',
        ).trim()

        if (!googleToken) {
          setConnectedById((prev) => ({ ...prev, [normalized]: false }))
          setConnectionError('Google Drive connected, but no upload token was received. Reconnect Google Drive and approve Drive file permissions.')
          return
        }

        setConnectedById((prev) => ({ ...prev, [normalized]: true }))
        setConnectionInfo('Google Drive connected for uploads.')
        return
      }

      if (normalized === 'dropbox') {
        let token = ''
        if (manualToken) {
          const accounts = getConnectedAccounts()
          const newAccount = {
            provider: 'dropbox',
            connected: true,
            user: {
              uuid: `dropbox-user-manual-${Date.now()}`,
              first_name: 'Dropbox',
              last_name: 'User (Manual)',
              email: `dropbox.${Date.now()}@manual.local`,
              registration_type: 'dropbox',
              active: 1,
              dropbox_access_token: manualToken.trim(),
              access_token: manualToken.trim(),
            }
          }
          const filtered = accounts.filter(a => a.provider !== 'dropbox')
          filtered.push(newAccount)
          saveConnectedAccounts(filtered)
          token = manualToken.trim()
        } else {
          const accounts = await connectAccount('dropbox')
          const dropboxAccount = Array.isArray(accounts)
            ? accounts.find((account) => account?.provider === 'dropbox' && account?.connected)
            : null
          token = String(
            dropboxAccount?.user?.dropbox_access_token ||
            dropboxAccount?.user?.access_token ||
            ''
          ).trim()
        }

        if (!token) {
          setConnectedById((prev) => ({ ...prev, [normalized]: false }))
          setConnectionError('Dropbox connected, but no upload token was received. Reconnect Dropbox and approve permissions.')
          return
        }

        setConnectedById((prev) => ({ ...prev, [normalized]: true }))
        setConnectionInfo('Dropbox connected for uploads.')
        return
      }

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

        const missingFields = Array.isArray(result?.missingFields)
          ? result.missingFields.map((field) => String(field || '').trim()).filter(Boolean)
          : []

        const baseMessage = String(result?.message || '').trim()
        const providerName = provider?.name || normalized

        const fallbackMessage = missingFields.length
          ? `${providerName} is not configured for this account. Missing: ${missingFields.join(', ')}. Add provider credentials in account settings or server environment, then connect again.`
          : `${providerName} is not configured for this account.`

        setConnectionError(baseMessage || fallbackMessage)
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

  const onMigrationComplete = useCallback(({ videoId, sourceType, sourceUrl, title, description, originalSourceUrl } = {}) => {
    const resolvedVideoId = String(videoId || '').trim()
    if (!resolvedVideoId) {
      return
    }

    const normalizedSourceType = String(sourceType || '').trim().toLowerCase()
    const resolvedSourceUrl = String(sourceUrl || '').trim()
    const resolvedTitle = String(title || '').trim() || 'Migrated video'
    const resolvedDescription = String(description || '').trim()

    saveLocalChannelVideo({
      uuid: resolvedVideoId,
      id: resolvedVideoId,
      title: resolvedTitle,
      name: resolvedTitle,
      description: resolvedDescription,
      source_url: resolvedSourceUrl,
      video_url: resolvedSourceUrl,
      original_source_url: String(originalSourceUrl || '').trim(),
      type: normalizedSourceType === 'local' ? 'Google Drive' : 'Migration',
      privacy_option: 'public',
    })

    if (resolvedSourceUrl) {
      const query = new URLSearchParams({ src: resolvedSourceUrl })
      if (resolvedTitle) query.set('title', resolvedTitle)
      if (resolvedDescription) query.set('description', resolvedDescription)
      query.set('sourceType', normalizedSourceType || 'creator_migrated')
      navigate(`/watch/${encodeURIComponent(resolvedVideoId)}?${query.toString()}`)
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

          {/* Dropbox personal token connection helper */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setShowDropboxTokenInput(prev => !prev)
                setConnectionError('')
                setConnectionInfo('')
              }}
              sx={{ textTransform: 'none', fontSize: '0.8rem', color: 'text.secondary', borderColor: 'divider' }}
            >
              {showDropboxTokenInput ? 'Hide Dropbox Token Option' : 'Connect Dropbox with Access Token (Alternative)'}
            </Button>
          </Box>

          {showDropboxTokenInput && (
            <Box sx={{ p: 2.5, border: '1px solid rgba(255, 255, 255, 0.1)', bgcolor: 'rgba(255, 255, 255, 0.02)', borderRadius: 2, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Dropbox Access Token / dbxcli Token connection
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem' }}>
                Dropbox API apps have a strict <strong>user limit</strong> in development mode. If you see an error in the login popup, you can bypass it completely by pasting a <strong>Personal Access Token</strong> generated from your Dropbox App Console:
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
                <input
                  type="password"
                  placeholder="Paste Dropbox Access Token..."
                  value={dropboxTokenValue}
                  onChange={(e) => setDropboxTokenValue(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '8px 12px',
                    fontSize: '0.875rem'
                  }}
                />
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    if (!dropboxTokenValue.trim()) {
                      setConnectionError('Please enter a valid token.')
                      return
                    }
                    try {
                      const accounts = getConnectedAccounts()
                      const newAccount = {
                        provider: 'dropbox',
                        connected: true,
                        user: {
                          uuid: `dropbox-user-manual-${Date.now()}`,
                          first_name: 'Dropbox',
                          last_name: 'User (Manual)',
                          email: `dropbox.${Date.now()}@manual.local`,
                          registration_type: 'dropbox',
                          active: 1,
                          dropbox_access_token: dropboxTokenValue.trim(),
                          access_token: dropboxTokenValue.trim(),
                        }
                      }
                      const filtered = accounts.filter(a => a.provider !== 'dropbox')
                      filtered.push(newAccount)
                      saveConnectedAccounts(filtered)
                      setConnectedById(prev => ({ ...prev, dropbox: true }))
                      setConnectionInfo('Dropbox connected via Personal Access Token!')
                      setDropboxTokenValue('')
                      setShowDropboxTokenInput(false)
                    } catch (err) {
                      setConnectionError('Failed to save manual token: ' + err.message)
                    }
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Connect Token
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block">
                💡 <strong>Instructions:</strong> Go to the <a href="https://www.dropbox.com/developers/apps" target="_blank" rel="noreferrer" style={{ color: '#90caf9', textDecoration: 'underline' }}>Dropbox App Console</a>, select/create your app, scroll to <strong>Generated access token</strong>, and click <strong>Generate</strong>.
              </Typography>
            </Box>
          )}

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

