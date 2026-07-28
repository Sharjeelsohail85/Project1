import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import css2Html from './source/css2/index.html?raw'
import css2Css from './source/css2/style.css?raw'
import css2Js from './source/css2/script.js?raw'

const CHANNEL = 'css2-exact'

export default function Css2Exact({ onColorChange = () => {} }) {
  const [frameHeight, setFrameHeight] = useState(620)
  const [hoveredColorName, setHoveredColorName] = useState('')

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    const href = 'https://fonts.googleapis.com/css2?family=Micro+5&display=swap'
    let link = document.querySelector('link[data-css2-micro5="true"]')

    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'stylesheet')
      link.setAttribute('href', href)
      link.setAttribute('data-css2-micro5', 'true')
      document.head.appendChild(link)
    }

    return undefined
  }, [])

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

      if (data.type === 'hover') {
        setHoveredColorName(String(data.label || '').trim())
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

    item.addEventListener('mouseenter', () => {
      window.parent.postMessage({ source: '${CHANNEL}', type: 'hover', label: c }, '*');
    });

    item.addEventListener('mouseleave', () => {
      window.parent.postMessage({ source: '${CHANNEL}', type: 'hover', label: '' }, '*');
    });

    item.addEventListener('click', () => {
      const probe = document.createElement('span');
      probe.style.color = c;
      probe.style.display = 'none';
      document.body.appendChild(probe);
      const rgb = getComputedStyle(probe).color;
      document.body.removeChild(probe);
      const m = rgb.match(/[0-9]+/g);
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
  window.addEventListener('blur', () => {
    window.parent.postMessage({ source: '${CHANNEL}', type: 'hover', label: '' }, '*');
  });
  document.addEventListener('mouseleave', () => {
    window.parent.postMessage({ source: '${CHANNEL}', type: 'hover', label: '' }, '*');
  });
  setTimeout(scheduleHeightPost, 50);
  setTimeout(scheduleHeightPost, 250);
  setTimeout(scheduleHeightPost, 800);
})();
</script>
</body></html>`, [])

  const hoverOverlay = hoveredColorName && typeof document !== 'undefined'
    ? createPortal(
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          zIndex: 2147483647,
          textAlign: 'center',
          backgroundColor: '#fff',
          color: '#000',
          padding: '5px',
          fontFamily: '"Micro 5", sans-serif',
          fontSize: '3rem',
          fontWeight: 700,
          fontStyle: 'normal',
          textTransform: 'uppercase',
          lineHeight: 1.1,
          pointerEvents: 'none',
        }}
      >
        {hoveredColorName}
      </div>,
      document.body,
    )
    : null

  return (
    <>
      <iframe title="CSS2 Exact" srcDoc={srcDoc} style={{ width: '100%', height: frameHeight, border: 0, borderRadius: 10, background: '#000' }} />
      {hoverOverlay}
    </>
  )
}

