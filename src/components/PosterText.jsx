import { memo, useId, useMemo } from 'react'

const DEFAULT_TEXT = 'THENEEDLEDROP'

const PosterText = memo(function PosterText({
  text = DEFAULT_TEXT,
  className = '',
  ariaLabel = '',
}) {
  const rawText = String(text ?? '').trim()
  const normalizedText = (rawText || DEFAULT_TEXT).slice(0, 28).toUpperCase()
  const uid = useId().replace(/:/g, '')

  const distortFilterId = `poster-distort-${uid}`
  const grainFilterId = `poster-grain-${uid}`

  const viewWidth = Math.max(860, normalizedText.length * 58 + 220)
  const textLength = Math.max(520, viewWidth - 280)
  const dynamicFontSize = Math.max(84, Math.min(138, 190 - normalizedText.length * 2.8))

  const burstPoints = useMemo(() => {
    const centerX = viewWidth / 2
    const centerY = 126
    const spikes = 38
    const radiusX = viewWidth * 0.45
    const radiusY = 94
    const points = []

    for (let i = 0; i < spikes; i += 1) {
      const angle = (Math.PI * 2 * i) / spikes
      const outerRatio = i % 2 === 0 ? 1.08 : 0.82
      const wobble = 1 + Math.sin(i * 0.9) * 0.06
      const x = centerX + Math.cos(angle) * radiusX * outerRatio * wobble
      const y = centerY + Math.sin(angle) * radiusY * outerRatio * (1 + Math.cos(i * 0.7) * 0.05)
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`)
    }

    return points.join(' ')
  }, [viewWidth])

  return (
    <div
      className={`poster-text-logo ${className}`.trim()}
      role="img"
      aria-label={ariaLabel || `${normalizedText} poster logo`}
    >
      <svg viewBox={`0 0 ${viewWidth} 260`} xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <defs>
          <filter id={distortFilterId} x="-20%" y="-40%" width="140%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="1" seed="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" xChannelSelector="R" yChannelSelector="B" />
          </filter>
          <filter id={grainFilterId} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="8" result="noise" />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.14 0
              "
              result="grainAlpha"
            />
            <feBlend in="SourceGraphic" in2="grainAlpha" mode="multiply" />
          </filter>
        </defs>

        <polygon className="poster-text-burst" points={burstPoints} />

        <g transform={`rotate(-5 ${viewWidth / 2} 126)`}>
          <text
            className="poster-text-outline"
            x="50%"
            y="52%"
            textAnchor="middle"
            dominantBaseline="middle"
            textLength={textLength}
            lengthAdjust="spacingAndGlyphs"
            style={{ fontSize: `${dynamicFontSize}px` }}
          >
            {normalizedText}
          </text>

          <text
            className="poster-text-fill"
            x="50%"
            y="52%"
            textAnchor="middle"
            dominantBaseline="middle"
            textLength={textLength}
            lengthAdjust="spacingAndGlyphs"
            filter={`url(#${distortFilterId})`}
            style={{ fontSize: `${dynamicFontSize}px` }}
          >
            {normalizedText}
          </text>

          <text
            className="poster-text-grain"
            x="50%"
            y="52%"
            textAnchor="middle"
            dominantBaseline="middle"
            textLength={textLength}
            lengthAdjust="spacingAndGlyphs"
            filter={`url(#${grainFilterId})`}
            style={{ fontSize: `${dynamicFontSize}px` }}
          >
            {normalizedText}
          </text>
        </g>
      </svg>
    </div>
  )
})

export default PosterText
