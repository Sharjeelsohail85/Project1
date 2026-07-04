import { memo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

const DEFAULT_PROVIDERS = [
  { id: 'gdrive', label: 'Google Drive' },
  { id: 'dropbox', label: 'Dropbox' },
  { id: 'idrive', label: 'IDrive e2' },
  { id: 's3', label: 'Custom S3' },
]

const StorageProviderSelector = memo(function StorageProviderSelector({
  selectedProvider = '',
  connectedProviders = [],
  onProviderSelected,
  onRequestConnect,
  providers = DEFAULT_PROVIDERS,
}) {
  const [showDropboxManual, setShowDropboxManual] = useState(false)
  const [dropboxManualToken, setDropboxManualToken] = useState('')

  const connectedSet = new Set(
    (Array.isArray(connectedProviders) ? connectedProviders : [])
      .map((provider) => String(provider || '').trim().toLowerCase())
      .filter(Boolean),
  )

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="h6">Storage Selection</Typography>
          <Typography variant="body2" color="text.secondary">
            Select where migrated files should be stored. Only metadata stays in our database.
          </Typography>

          <Stack spacing={1}>
            {providers.map((provider) => {
              const providerId = String(provider.id || '').trim().toLowerCase()
              const isConnected = connectedSet.has(providerId)
              const isSelected = String(selectedProvider || '').trim().toLowerCase() === providerId

              return (
                <Box key={providerId} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.25,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body1">{provider.label}</Typography>
                      {isConnected ? (
                        <Chip size="small" color="success" label="connected ✓" />
                      ) : (
                        <Chip size="small" variant="outlined" label="not connected" />
                      )}
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      {providerId === 'dropbox' && !isConnected && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => setShowDropboxManual(prev => !prev)}
                          sx={{
                            textTransform: 'none',
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '0.75rem',
                            border: '1px solid rgba(255,255,255,0.15)',
                            padding: '4px 8px',
                          }}
                        >
                          {showDropboxManual ? 'Cancel' : 'Use Token'}
                        </Button>
                      )}

                      {isConnected ? (
                        <Button
                          variant={isSelected ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => onProviderSelected?.(providerId)}
                          sx={{ textTransform: 'none' }}
                        >
                          {isSelected ? 'Selected' : 'Use'}
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => onRequestConnect?.(providerId)}
                          sx={{ textTransform: 'none' }}
                        >
                          Connect
                        </Button>
                      )}
                    </Stack>
                  </Box>

                  {providerId === 'dropbox' && showDropboxManual && !isConnected && (
                    <Box
                      sx={{
                        p: 1.5,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        bgcolor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                        Enter Dropbox Personal Access Token to connect directly (bypassing user limits):
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <input
                          type="password"
                          placeholder="Paste Dropbox token..."
                          value={dropboxManualToken}
                          onChange={(e) => setDropboxManualToken(e.target.value)}
                          style={{
                            flex: 1,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '4px',
                            color: '#fff',
                            padding: '6px 10px',
                            fontSize: '0.8rem',
                          }}
                        />
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => {
                            if (!dropboxManualToken.trim()) return
                            onRequestConnect?.('dropbox', dropboxManualToken.trim())
                            setDropboxManualToken('')
                            setShowDropboxManual(false)
                          }}
                          sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                        >
                          Submit
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </Box>
              )
            })}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
})

export default StorageProviderSelector

