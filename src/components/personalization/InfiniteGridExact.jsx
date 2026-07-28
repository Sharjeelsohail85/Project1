import { useEffect, useMemo } from 'react'
import infiniteHtml from './source/infinite/index.html?raw'
import infiniteCss from './source/infinite/style.css?raw'
import infiniteJs from './source/infinite/script.js?raw'

const CHANNEL = 'infinite-grid-exact'

export default function InfiniteGridExact({ onColorChange = () => {} }) {
  useEffect(() => {
    const onMessage = (event) => {
      const data = event?.data
      if (!data || data.source !== CHANNEL || !data.color) return
      onColorChange(data.color)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onColorChange])

  const srcDoc = useMemo(() => `<!doctype html>
<html><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${infiniteCss}</style>
</head><body>
${infiniteHtml}
<script>window.__THEME_BRIDGE = '${CHANNEL}';</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script>${infiniteJs}</script>
</body></html>`, [])

  return <iframe title="Infinite Grid Exact" srcDoc={srcDoc} style={{ width: '100%', height: 420, border: 0, borderRadius: 10, background: '#0a0a0a' }} />
}

