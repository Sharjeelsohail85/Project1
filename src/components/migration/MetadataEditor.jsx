import { memo, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

const MetadataEditor = memo(function MetadataEditor({ metadata, onChange }) {
  const [nextTag, setNextTag] = useState('')

  const visibilityOptions = useMemo(() => (['public', 'unlisted', 'private']), [])
  const tags = Array.isArray(metadata?.tags) ? metadata.tags : []

  const addTag = () => {
    const trimmed = String(nextTag || '').trim()
    if (!trimmed) return
    if (tags.some((tag) => String(tag || '').toLowerCase() === trimmed.toLowerCase())) {
      setNextTag('')
      return
    }

    onChange?.({
      ...metadata,
      tags: [...tags, trimmed],
    })
    setNextTag('')
  }

  const removeTag = (tagToRemove) => {
    onChange?.({
      ...metadata,
      tags: tags.filter((tag) => String(tag) !== String(tagToRemove)),
    })
  }

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="h6">Metadata Editor</Typography>

          <TextField
            label="Title"
            value={metadata?.title || ''}
            onChange={(event) => onChange?.({ ...metadata, title: event.target.value })}
            fullWidth
          />

          <TextField
            label="Description"
            value={metadata?.description || ''}
            onChange={(event) => onChange?.({ ...metadata, description: event.target.value })}
            multiline
            minRows={3}
            fullWidth
          />

          <TextField
            label="Thumbnail URL"
            value={metadata?.thumbnail || ''}
            onChange={(event) => onChange?.({ ...metadata, thumbnail: event.target.value })}
            placeholder="https://example.com/thumbnail.jpg"
            fullWidth
          />

          <TextField
            select
            label="Visibility"
            value={metadata?.visibility || 'public'}
            onChange={(event) => onChange?.({ ...metadata, visibility: event.target.value })}
            fullWidth
          >
            {visibilityOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option[0].toUpperCase() + option.slice(1)}
              </MenuItem>
            ))}
          </TextField>

          <Box>
            <TextField
              label="Tags"
              value={nextTag}
              onChange={(event) => setNextTag(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                addTag()
              }}
              placeholder="Type tag and press Enter"
              fullWidth
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1 }}>
              {tags.map((tag) => (
                <Chip
                  key={String(tag)}
                  label={String(tag)}
                  onDelete={() => removeTag(tag)}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
})

export default MetadataEditor

