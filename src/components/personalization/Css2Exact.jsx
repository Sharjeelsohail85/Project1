import { useEffect, useMemo, useState } from 'react'
import css2Html from './source/css2/index.html?raw'
import css2Css from './source/css2/style.css?raw'
import css2Js from './source/css2/script.js?raw'

const CHANNEL = 'css2-exact'

export default function Css2Exact({ onColorChange = () => {} }) {
  const [frameHeight, setFrameHeight] = useState(620)

  useEffect(() => {
    const onMessage = (event) => {
      const data = event?.data
      if (!data || data.source !== CHANNEL) return

      if (data.type === 'height') {
        const parsedHeight = Number(data.height)
        if (Number.isFinite(parsedHeight)) {
          const nextHeight = Math.max(380, Math.min(2400, Math.round(parsedHeight)))
          setFrameHeight((prev) => (prev === nextHeight ? prev : nextHeight))
        }
      }

      if (data.color) {
        onColorChange(data.color)
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onColorChange])

  const srcDoc = useMemo(() => `<!doctype html>
<html><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${css2Css}</style>
</head><body>
${css2Html}
<script>${css2Js}</script>
<script>
(() => {
  const postHeight = () => {
    const doc = document.documentElement;
    const body = document.body;
    const height = Math.max(
      doc ? doc.scrollHeight : 0,
      body ? body.scrollHeight : 0,
      doc ? doc.offsetHeight : 0,
      body ? body.offsetHeight : 0,
    );

    window.parent.postMessage({ source: '${CHANNEL}', type: 'height', height }, '*');
  };

  const scheduleHeightPost = () => requestAnimationFrame(postHeight);

  const list = document.querySelectorAll('#colors li');
  list.forEach((item) => {
    const c = (item.title || '').trim();
    item.addEventListener('click', () => {
      const probe = document.createElement('span');
      probe.style.color = c;
      probe.style.display = 'none';
      document.body.appendChild(probe);
      const rgb = getComputedStyle(probe).color;
      document.body.removeChild(probe);
      const m = rgb.match(/\d+/g);
      if (!m || m.length < 3) return;
      const hex = '#' + m.slice(0,3).map(v => Number(v).toString(16).padStart(2, '0')).join('');
      window.parent.postMessage({ source: '${CHANNEL}', color: hex }, '*');
      scheduleHeightPost();
    });
  });

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => scheduleHeightPost());
    observer.observe(document.documentElement);
    observer.observe(document.body);
  }

  if (typeof MutationObserver !== 'undefined') {
    const mutationObserver = new MutationObserver(() => scheduleHeightPost());
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  }

  window.addEventListener('load', scheduleHeightPost);
  window.addEventListener('resize', scheduleHeightPost);
  setTimeout(scheduleHeightPost, 50);
  setTimeout(scheduleHeightPost, 250);
  setTimeout(scheduleHeightPost, 800);
})();
</script>
</body></html>`, [])

  return <iframe title="CSS2 Exact" srcDoc={srcDoc} style={{ width: '100%', height: frameHeight, border: 0, borderRadius: 10, background: '#000' }} />
}

