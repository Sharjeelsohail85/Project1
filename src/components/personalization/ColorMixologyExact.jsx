import { useEffect, useMemo, useRef } from 'react'
import mixologyHtml from './source/color-mixology/index.html?raw'
import mixologyCss from './source/color-mixology/style.css?raw'
import mixologyJs from './source/color-mixology/script.js?raw'

const CHANNEL = 'color-mixology-exact'

export default function ColorMixologyExact({ onColorChange = () => {} }) {
  const onColorChangeRef = useRef(onColorChange)

  useEffect(() => {
    onColorChangeRef.current = onColorChange
  }, [onColorChange])

  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    const href = 'https://fonts.googleapis.com/icon?family=Material+Icons'
    let link = document.querySelector('link[data-mixology-icons="true"]')

    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'stylesheet')
      link.setAttribute('href', href)
      link.setAttribute('data-mixology-icons', 'true')
      document.head.appendChild(link)
    }

    return undefined
  }, [])

  useEffect(() => {
    let timer = null
    let lastColor = null

    const onMessage = (event) => {
      const data = event?.data
      if (!data || data.source !== CHANNEL || !data.color) return

      const color = data.color
      if (color === lastColor) return
      lastColor = color

      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        if (typeof onColorChangeRef.current === 'function') {
          onColorChangeRef.current(color)
        }
      }, 50)
    }

    window.addEventListener('message', onMessage)
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('message', onMessage)
    }
  }, [])

  const srcDoc = useMemo(() => `<!doctype html>
<html><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<style>${mixologyCss}</style>
</head><body>
${mixologyHtml}
<script>${mixologyJs}</script>
</body></html>`, [])

  return (
    <iframe
      title="Color Mixology Exact"
      srcDoc={srcDoc}
      style={{
        width: '100%',
        minHeight: 680,
        height: 'auto',
        border: 0,
        borderRadius: 16,
        background: '#0f172a',
        overflow: 'hidden'
      }}
    />
  )
}

