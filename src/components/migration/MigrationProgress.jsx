import { memo } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import LinearProgress from '@mui/material/LinearProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

const MigrationProgress = memo(function MigrationProgress({
  progress = 0,
  stageLabel = '',
  stageTimeline = [],
  completed = false,
  error = '',
  warning = '',
}) {
  const displayError = (() => {
    if (!error) return ''
    if (typeof error === 'string') {
      if (error === '[object Object]') {
        return 'An unexpected error occurred during migration.'
      }
      return error
    }
    try {
      if (error.message) return String(error.message)
      const stringified = JSON.stringify(error)
      if (stringified === '{}') {
        return String(error)
      }
      return stringified
    } catch {
      return String(error)
    }
  })()

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="h6">Migration Progress</Typography>

          {warning ? <Alert severity="warning">{warning}</Alert> : null}
          {displayError ? <Alert severity="error">{displayError}</Alert> : null}

          <Box>
            <Typography variant="body2" sx={{ mb: 0.8 }}>
              {stageLabel || 'Waiting to start...'}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, Number(progress) || 0))}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
              {Math.round(Math.max(0, Math.min(100, Number(progress) || 0)))}%
            </Typography>
          </Box>

          <List dense sx={{ bgcolor: 'action.hover', borderRadius: 1.5 }}>
            {stageTimeline.map((step) => (
              <ListItem key={String(step.key || step.label)}>
                <ListItemText
                  primary={step.label}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: step.active ? 700 : 400,
                  }}
                  secondary={step.done ? 'Done' : step.active ? 'In progress' : 'Pending'}
                />
              </ListItem>
            ))}
          </List>

          {completed ? <Alert severity="success">Migration finished successfully.</Alert> : null}
        </Stack>
      </CardContent>
    </Card>
  )
})

export default MigrationProgress

