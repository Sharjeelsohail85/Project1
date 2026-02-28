import { memo } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

const SourceInput = memo(function SourceInput({
  sourceType = 'url',
  sourceUrl = '',
  localFile = null,
  onSourceTypeChange,
  onSourceUrlChange,
  onLocalFileChange,
  validationError = '',
}) {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="h6">Import Source</Typography>

          <ToggleButtonGroup
            value={sourceType}
            exclusive
            onChange={(_, value) => {
              if (!value) return
              onSourceTypeChange?.(value)
            }}
            size="small"
            color="primary"
          >
            <ToggleButton value="url">Direct Video URL</ToggleButton>
            <ToggleButton value="local">Upload From Local</ToggleButton>
            <ToggleButton value="account">Linked Account Import</ToggleButton>
          </ToggleButtonGroup>

          {sourceType === 'url' ? (
            <TextField
              label="Video URL"
              value={sourceUrl}
              onChange={(event) => onSourceUrlChange?.(event.target.value)}
              placeholder="https://example.com/video.mp4"
              fullWidth
              error={Boolean(validationError)}
              helperText={validationError || 'Must resolve to a direct video mime type (not playlist).'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">https://</InputAdornment>
                ),
              }}
            />
          ) : null}

          {sourceType === 'local' ? (
            <Box>
              <TextField
                label="Selected local file"
                value={localFile ? `${localFile.name} (${Math.round(localFile.size / (1024 * 1024))} MB)` : ''}
                placeholder="Choose a local video file"
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <Box sx={{ mt: 1 }}>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null
                    onLocalFileChange?.(file)
                  }}
                />
              </Box>
              <Alert severity="info" sx={{ mt: 1.25 }}>
                Local uploads use resumable transfer to migration backend, then provider storage upload.
              </Alert>
            </Box>
          ) : null}

          {sourceType === 'account' ? (
            <Alert severity="info">
              This feature lets you import videos you own from connected platforms.
            </Alert>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  )
})

export default SourceInput

