import { useEffect, useMemo } from 'react'
import mixingHtml from './source/mixing/index.html?raw'
import mixingCss from './source/mixing/style.css?raw'
import mixingJs from './source/mixing/script.js?raw'

const CHANNEL = 'mixing-exact'

export default function MixingExact({ onColorChange = () => {} }) {
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
<style>${mixingCss}</style>
</head><body>
${mixingHtml}
<script>${mixingJs}</script>
<script>
(() => {
  const emit = () => {
    const txt = document.getElementById('resultBox')?.textContent || '';
    const m = txt.match(/#[0-9A-Fa-f]{6}/);
    if (m) window.parent.postMessage({ source: '${CHANNEL}', color: m[0] }, '*');
  };
  document.getElementById('color1')?.addEventListener('input', emit);
  document.getElementById('color2')?.addEventListener('input', emit);
  emit();
})();
</script>
</body></html>`, [])

  return <iframe title="Mixing Exact" srcDoc={srcDoc} style={{ width: '100%', height: 460, border: 0, borderRadius: 10, background: '#000' }} />
}

