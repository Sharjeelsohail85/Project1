import { memo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const FAQ_ITEMS = [
  {
    question: 'How is this app decentralized?',
    answer:
      'You connect your own storage providers and keep your videos there. The app manages channel metadata and playback references so people can browse and stream through your channel, while the media stays in accounts you control.',
  },
  {
    question: 'Do I still own my content?',
    answer:
      'Yes. You retain ownership of your files because they remain in your selected provider accounts. You can move, replace, or delete your media directly at the source whenever you choose.',
  },
  {
    question: 'How do viewers stream my videos?',
    answer:
      'When someone opens a video on your channel, the app resolves a playback URL from the linked provider and streams it in the player. Channel discovery is centralized for convenience, storage remains user-owned.',
  },
  {
    question: 'Are files copied into centralized storage by default?',
    answer:
      'No. Default behavior is provider-based streaming from your connected source. Migration or re-upload workflows are explicit actions that you trigger.',
  },
  {
    question: 'Can I use multiple storage providers?',
    answer:
      'Yes. You can connect multiple providers, select files from each, and publish them through a single channel experience. This helps reduce lock-in and improves resilience.',
  },
  {
    question: 'What if provider access expires?',
    answer:
      'If OAuth tokens expire or permissions are revoked, playback may fail until you reconnect that provider. Re-authentication restores access for supported files without losing your saved channel metadata.',
  },
  {
    question: 'Who pays for storage and bandwidth?',
    answer:
      'You do, under the pricing model of your selected providers. This gives you direct control over cost, region, retention policy, and compliance requirements.',
  },
  {
    question: 'Can I migrate videos between providers later?',
    answer:
      'Yes. You can import from connected sources and republish as needed. A common strategy is keeping a secondary provider for backup and phased migration.',
  },
  {
    question: 'How do I secure private videos?',
    answer:
      'Use strict provider permissions, keep authentication connections healthy, and enable multi-factor authentication on storage accounts. Review shared links and app permissions regularly.',
  },
  {
    question: 'What should I check if playback fails?',
    answer:
      'Confirm provider permission scope, reconnect expired sessions, verify file existence, and ensure stream URL and MIME metadata are valid. Most errors are source-access related.',
  },
]

const PageFaq = memo(function PageFaq({ isAuthenticated = false }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 3, md: 5 },
        backgroundColor: 'var(--md-background)',
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={2.5}>
          <Box
            sx={{
              p: { xs: 2, md: 3 },
              border: '1px solid var(--md-outline)',
              borderRadius: 2,
              backgroundColor: 'var(--md-surface)',
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label="FAQ" size="small" />
                <Chip label="User-owned content" size="small" variant="outlined" />
                <Chip label="Decentralized channel streaming" size="small" variant="outlined" />
              </Stack>

              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Frequently Asked Questions
              </Typography>

              <Typography variant="body1" sx={{ color: 'var(--md-on-surface-variant)' }}>
                This app lets creators store videos with providers they choose, keep ownership of media,
                and still offer a channel that other users can browse and stream.
              </Typography>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ pt: 0.5 }}>
                {isAuthenticated ? (
                  <Button
                    component={RouterLink}
                    to="/studio/migrate"
                    variant="contained"
                    sx={{ textTransform: 'none' }}
                  >
                    Open Migration Studio
                  </Button>
                ) : (
                  <Button component={RouterLink} to="/" variant="contained" sx={{ textTransform: 'none' }}>
                    Sign in to start
                  </Button>
                )}

                <Button component={RouterLink} to="/channel" variant="outlined" sx={{ textTransform: 'none' }}>
                  Go to Channel
                </Button>

                <Button
                  component="a"
                  href="/TERMS_AND_CONDITIONS.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="text"
                  sx={{ textTransform: 'none' }}
                >
                  Terms & Conditions
                </Button>
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ display: 'grid', gap: 1.25 }}>
            {FAQ_ITEMS.map((item) => (
              <Accordion
                key={item.question}
                disableGutters
                sx={{
                  border: '1px solid var(--md-outline)',
                  borderRadius: '12px',
                  backgroundColor: 'var(--md-surface)',
                  '&::before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    px: 2,
                    '& .MuiAccordionSummary-content': {
                      my: 1.25,
                    },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {item.question}
                  </Typography>
                </AccordionSummary>

                <AccordionDetails sx={{ px: 2, pt: 0, pb: 1.75 }}>
                  <Typography variant="body2" sx={{ color: 'var(--md-on-surface-variant)' }}>
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  )
})

export default PageFaq
