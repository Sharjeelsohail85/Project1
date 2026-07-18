import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const CANONICAL_HOST = ''

function normalizePathname(pathname) {
  const value = String(pathname || '/').trim()
  if (!value || value === '/') return '/'
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function getBaseOrigin() {
  if (typeof window === 'undefined') {
    return CANONICAL_HOST ? `https://${CANONICAL_HOST}` : ''
  }

  const host = String(window.location.hostname || '').toLowerCase()
  if (CANONICAL_HOST && (host === 'localhost' || host === '127.0.0.1' || host.endsWith('workers.dev'))) {
    return `https://${CANONICAL_HOST}`
  }

  return window.location.origin || (CANONICAL_HOST ? `https://${CANONICAL_HOST}` : '')
}

function upsertMeta(attr, key, content) {
  if (typeof document === 'undefined') return
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', String(content || ''))
}

function upsertCanonical(href) {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function upsertJsonLd(json) {
  if (typeof document === 'undefined') return
  const id = 'seo-jsonld-dynamic'
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.text = JSON.stringify(json)
}

function removeJsonLd() {
  if (typeof document === 'undefined') return
  const el = document.getElementById('seo-jsonld-dynamic')
  if (el && el.parentNode) {
    el.parentNode.removeChild(el)
  }
}

function getRouteSeo(pathname) {
  const path = normalizePathname(pathname)

  if (path === '/') {
    return {
      title: 'Octopussol | Creator-First Video Platform',
      description:
        'Octopussol is a creator-first video platform for uploading, migrating, organizing, and streaming videos with cloud integrations including Google Drive and Dropbox.',
      robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Octopussol',
        url: CANONICAL_HOST ? `https://${CANONICAL_HOST}/` : '/',
      },
    }
  }

  if (path === '/faq') {
    return {
      title: 'FAQ | Octopussol',
      description:
        'Learn how Octopussol works: decentralized creator video workflows, multi-cloud migration, playback behavior, and storage ownership.',
      robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        name: 'Octopussol FAQ',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How is this app decentralized?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Creators keep media in their connected providers while Octopussol handles channel metadata and playback references.'
            }
          },
          {
            '@type': 'Question',
            name: 'Do I still own my content?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. You retain ownership because files remain in your selected provider accounts.'
            }
          },
          {
            '@type': 'Question',
            name: 'Can I use multiple storage providers?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. You can connect multiple providers and publish through one channel experience.'
            }
          }
        ]
      },
    }
  }

  if (path.startsWith('/watch/')) {
    return {
      title: 'Watch Video | Octopussol',
      description: 'Watch creator videos on Octopussol with cloud-integrated playback.',
      robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: 'Octopussol video',
        description: 'Creator video streamed through Octopussol.',
      },
    }
  }

  if (path === '/privacy-policy.html') {
    return {
      title: 'Privacy Policy | Octopussol',
      description: 'Read the Octopussol Privacy Policy.',
      robots: 'index,follow',
    }
  }

  if (path === '/terms-and-conditions.html') {
    return {
      title: 'Terms and Conditions | Octopussol',
      description: 'Read the Octopussol Terms and Conditions.',
      robots: 'index,follow',
    }
  }

  if (path === '/settings' || path === '/theme-designer' || path === '/channel' || path === '/studio/migrate' || path === '/post' || path === '/login') {
    return {
      title: 'Octopussol App',
      description: 'Octopussol application area for authenticated users.',
      robots: 'noindex,nofollow',
    }
  }

  return {
    title: 'Octopussol App',
    description: 'Octopussol creator video app interface.',
    robots: 'noindex,nofollow',
  }
}

const SeoManager = function SeoManager() {
  const location = useLocation()

  useEffect(() => {
    const baseOrigin = getBaseOrigin()
    const path = normalizePathname(location.pathname)
    const seo = getRouteSeo(path)
    const canonical = `${baseOrigin}${path === '/' ? '/' : path}`

    document.title = seo.title
    upsertMeta('name', 'description', seo.description)
    upsertMeta('name', 'robots', seo.robots)
    upsertMeta('name', 'theme-color', '#673ab7')
    upsertCanonical(canonical)

    upsertMeta('property', 'og:type', path.startsWith('/watch/') ? 'video.other' : 'website')
    upsertMeta('property', 'og:site_name', 'Octopussol')
    upsertMeta('property', 'og:title', seo.title)
    upsertMeta('property', 'og:description', seo.description)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', `${baseOrigin}/og-image.svg`)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', seo.title)
    upsertMeta('name', 'twitter:description', seo.description)
    upsertMeta('name', 'twitter:image', `${baseOrigin}/og-image.svg`)

    if (seo.jsonLd) {
      upsertJsonLd(seo.jsonLd)
    } else {
      removeJsonLd()
    }
  }, [location.pathname])

  return null
}

export default SeoManager
