import { useEffect, useRef, useState } from 'react'
import baseAvatar from '../assets/images/channel_avatar_glitch_base_1784436675495.jpg'

export default function GlitchAvatar() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const imageRef = useRef(null)
  const animationFrameRef = useRef(null)
  const frameCountRef = useRef(0)
  const isGlitchActiveRef = useRef(false)
  const glitchDurationRef = useRef(0)

  // Pre-load the image
  useEffect(() => {
    const img = new Image()
    img.src = baseAvatar
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const width = 156  // Retina 2x for 78x78 display
    const height = 156
    canvas.width = width
    canvas.height = height

    let active = true

    const render = () => {
      if (!active) return

      frameCountRef.current++

      // Draw original image or fallback background first
      if (imageRef.current) {
        ctx.drawImage(imageRef.current, 0, 0, width, height)
      } else {
        // Fallback stylish gradient if image is still loading
        const grad = ctx.createLinearGradient(0, 0, width, height)
        grad.addColorStop(0, '#673ab7')
        grad.addColorStop(1, '#8f62df')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, width, height)
        
        // Draw standard podcasts icon symbol
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 64px "Material Icons"'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('podcasts', width / 2, height / 2)
      }

      // Determine if glitching this frame
      let shouldGlitch = false

      if (isHovered) {
        // Glitch intensely when hovered
        shouldGlitch = true
      } else {
        // Natural heartbeat glitch when idle:
        // Every 180 frames (~3 seconds), initiate a 6-frame glitch sequence
        if (frameCountRef.current % 180 === 0) {
          isGlitchActiveRef.current = true
          glitchDurationRef.current = Math.floor(Math.random() * 8) + 4 // 4-12 frames
        }

        if (isGlitchActiveRef.current) {
          shouldGlitch = true
          glitchDurationRef.current--
          if (glitchDurationRef.current <= 0) {
            isGlitchActiveRef.current = false
          }
        }
      }

      if (shouldGlitch && imageRef.current) {
        // 1. Chromatic Aberration / RGB Split
        try {
          const imgData = ctx.getImageData(0, 0, width, height)
          const data = imgData.data
          const outData = ctx.createImageData(width, height)
          const out = outData.data

          // Hover glitch is more intense than heartbeat glitch
          const maxShift = isHovered ? 8 : 4
          const shiftR = Math.round((Math.random() - 0.5) * maxShift)
          const shiftB = Math.round((Math.random() - 0.5) * maxShift)

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const destIdx = (y * width + x) * 4

              // Red channel shifted horizontally
              let rx = x + shiftR
              if (rx < 0) rx = 0
              if (rx >= width) rx = width - 1
              const rSrcIdx = (y * width + rx) * 4

              // Blue channel shifted horizontally
              let bx = x + shiftB
              if (bx < 0) bx = 0
              if (bx >= width) bx = width - 1
              const bSrcIdx = (y * width + bx) * 4

              out[destIdx]     = data[rSrcIdx]       // Red from shifted position
              out[destIdx + 1] = data[destIdx + 1]   // Green unshifted
              out[destIdx + 2] = data[bSrcIdx + 2]   // Blue from shifted position
              out[destIdx + 3] = data[destIdx + 3]   // Keep alpha
            }
          }
          ctx.putImageData(outData, 0, 0)
        } catch (e) {
          // Fallback if getImageData fails (e.g. CORS)
        }

        // 2. Horizontal Slices Displacement
        const numSlices = isHovered 
          ? Math.floor(Math.random() * 8) + 6   // 6 to 13 slices
          : Math.floor(Math.random() * 3) + 2   // 2 to 4 slices

        for (let i = 0; i < numSlices; i++) {
          const sy = Math.floor(Math.random() * height)
          const sh = Math.floor(Math.random() * (height / 3)) + 4
          const dispX = Math.floor((Math.random() - 0.5) * (isHovered ? 28 : 12))

          ctx.drawImage(canvas, 0, sy, width, sh, dispX, sy, width, sh)
        }

        // 3. Draw random colored stripes or digital artifacts
        const stripeChance = isHovered ? 0.5 : 0.2
        if (Math.random() < stripeChance) {
          const colors = [
            'rgba(0, 255, 240, 0.75)',  // Cyan
            'rgba(255, 0, 128, 0.75)',  // Neon Magenta
            'rgba(255, 235, 59, 0.8)',  // Neon Yellow
            'rgba(255, 255, 255, 0.95)' // Crisp White
          ]
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
          const rx = Math.floor(Math.random() * (width / 2))
          const ry = Math.floor(Math.random() * height)
          const rw = Math.floor(Math.random() * (width / 2)) + 15
          const rh = Math.floor(Math.random() * 8) + 2
          ctx.fillRect(rx, ry, rw, rh)
        }

        // 4. White Noise / Pixels overlay
        if (isHovered && Math.random() < 0.3) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
          for (let i = 0; i < 15; i++) {
            const nx = Math.floor(Math.random() * width)
            const ny = Math.floor(Math.random() * height)
            const nw = Math.floor(Math.random() * 10) + 2
            const nh = Math.floor(Math.random() * 10) + 2
            ctx.fillRect(nx, ny, nw, nh)
          }
        }
      }

      // 5. Constant subtle CRT Scanlines sweep
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1.5)
      }

      // 6. Cyan Laser Laser-sweep scanning overlay line
      const sweepY = (Date.now() / 15) % (height * 3) - height
      if (sweepY > 0 && sweepY < height) {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.2)'
        ctx.fillRect(0, sweepY, width, 1.5)
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)'
        ctx.fillRect(0, sweepY - 2, width, 5)
      }

      animationFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      active = false
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isHovered])

  return (
    <div
      ref={containerRef}
      className="channel-avatar"
      style={{
        width: '78px',
        height: '78px',
        borderRadius: '20px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        background: '#121212',
        boxShadow: isHovered 
          ? '0 0 25px rgba(0, 255, 255, 0.45), 0 8px 16px rgba(103, 58, 183, 0.4)'
          : '0 8px 16px rgba(103, 58, 183, 0.34)',
        transition: 'box-shadow 0.3s ease, transform 0.2s ease',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        display: 'block'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Channel Profile Photo"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '78px',
          height: '78px',
          display: 'block',
          borderRadius: '20px'
        }}
      />
    </div>
  )
}
