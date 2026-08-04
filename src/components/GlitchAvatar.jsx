import { useEffect, useRef, useState } from 'react'
import { Edit2 } from 'lucide-react'
import baseAvatarDefault from '../assets/images/channel_avatar_glitch_base_1784436675495.jpg'
import GlitchStudioModal, { PALETTES, PRESETS } from './GlitchStudioModal'

export default function GlitchAvatar() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Settings & Base Image States
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('glitch_studio_settings')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { /* ignore */ }
    }
    return JSON.parse(JSON.stringify(PRESETS['Default Lab']))
  })

  const [baseImage, setBaseImage] = useState(() => {
    return localStorage.getItem('glitch_studio_custom_image') || baseAvatarDefault
  })

  const imageRef = useRef(null)
  const animationFrameRef = useRef(null)
  const frameCountRef = useRef(0)
  const timeRef = useRef(0)

  // Pre-load the active image whenever baseImage changes
  useEffect(() => {
    const img = new Image()
    img.src = baseImage
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
    }
    img.onerror = () => {
      img.src = baseAvatarDefault
    }
  }, [baseImage])

  // Canvas drawing loop
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
      timeRef.current += 0.05

      // 1. Draw original base image
      if (imageRef.current) {
        ctx.drawImage(imageRef.current, 0, 0, width, height)
      } else {
        const grad = ctx.createLinearGradient(0, 0, width, height)
        grad.addColorStop(0, '#2a0e35')
        grad.addColorStop(1, '#15061c')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, width, height)
      }

      // Determine if glitching this frame:
      // If hovered: glitch continuously.
      // If idle: heartbeat glitch sequence every 180 frames.
      let shouldGlitch = false
      if (isHovered) {
        shouldGlitch = true
      } else {
        const cycle = frameCountRef.current % 200
        if (cycle > 180 && cycle < 192) {
          shouldGlitch = true
        }
      }

      if (shouldGlitch) {
        // 2. Palette Reduction (only if enabled)
        if (settings.paletteReduction.enabled) {
          const pal = PALETTES[settings.paletteReduction.palette] || PALETTES.Cyberpunk
          try {
            const imgData = ctx.getImageData(0, 0, width, height)
            const data = imgData.data

            const BAYER_MATRIX = [
              [ 0,  8,  2, 10],
              [12,  4, 14,  6],
              [ 3, 11,  1,  9],
              [15,  7, 13,  5]
            ]

            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4
                let r = data[idx]
                let g = data[idx + 1]
                let b = data[idx + 2]

                if (settings.paletteReduction.dithering) {
                  const threshold = BAYER_MATRIX[y % 4][x % 4]
                  // Scaled down dither factor for the small avatar
                  const ditherVal = (threshold - 7.5) * (settings.paletteReduction.ditherIntensity * 0.7)
                  r = Math.max(0, Math.min(255, r + ditherVal))
                  g = Math.max(0, Math.min(255, g + ditherVal))
                  b = Math.max(0, Math.min(255, b + ditherVal))
                }

                // Find closest color
                let minDistance = Infinity
                let closest = pal[0]
                for (let i = 0; i < pal.length; i++) {
                  const col = pal[i]
                  const dist = (r - col[0])**2 + (g - col[1])**2 + (b - col[2])**2
                  if (dist < minDistance) {
                    minDistance = dist
                    closest = col
                  }
                }

                data[idx] = closest[0]
                data[idx + 1] = closest[1]
                data[idx + 2] = closest[2]
              }
            }
            ctx.putImageData(imgData, 0, 0)
          } catch (e) {
            // Fallback
          }
        }

        // 3. Chromatic Aberration / Color Shift (only if enabled)
        if (settings.colorShift.enabled) {
          try {
            const imgData = ctx.getImageData(0, 0, width, height)
            const data = imgData.data
            const outData = ctx.createImageData(width, height)
            const out = outData.data

            // Shift amounts scaled down slightly for small display size
            const shift = Math.round(settings.colorShift.shiftAmount * settings.colorShift.intensity * 0.5)
            const shiftR = settings.colorShift.uniformShift ? shift : Math.round((Math.random() - 0.5) * shift * 2)
            const shiftB = settings.colorShift.uniformShift ? -shift : Math.round((Math.random() - 0.5) * shift * 2)

            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const destIdx = (y * width + x) * 4

                let rx = x + shiftR
                if (rx < 0) rx = 0
                if (rx >= width) rx = width - 1
                const rSrcIdx = (y * width + rx) * 4

                let bx = x + shiftB
                if (bx < 0) bx = 0
                if (bx >= width) bx = width - 1
                const bSrcIdx = (y * width + bx) * 4

                out[destIdx] = data[rSrcIdx]
                out[destIdx + 1] = data[destIdx + 1]
                out[destIdx + 2] = data[bSrcIdx + 2]
                out[destIdx + 3] = data[destIdx + 3]
              }
            }
            ctx.putImageData(outData, 0, 0)
          } catch (e) {
            // Fallback
          }
        }

        // 4. Wave Deform
        if (settings.waveDeform.enabled) {
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = width
          tempCanvas.height = height
          const tempCtx = tempCanvas.getContext('2d')
          tempCtx.drawImage(canvas, 0, 0)

          ctx.fillStyle = '#000000'
          ctx.fillRect(0, 0, width, height)

          const amp = settings.waveDeform.amplitude * 0.4 // Scaled for 156px canvas
          if (settings.waveDeform.direction === 'Horizontal') {
            for (let y = 0; y < height; y++) {
              const offset = Math.sin(y * settings.waveDeform.frequency * 1.5 + timeRef.current * settings.waveDeform.speed) * amp
              ctx.drawImage(tempCanvas, 0, y, width, 1, offset, y, width, 1)
            }
          } else {
            for (let x = 0; x < width; x++) {
              const offset = Math.sin(x * settings.waveDeform.frequency * 1.5 + timeRef.current * settings.waveDeform.speed) * amp
              ctx.drawImage(tempCanvas, x, 0, 1, height, x, offset, 1, height)
            }
          }
        }

        // 5. Horizontal Chop Slices
        if (settings.chopSlices.enabled) {
          if (frameCountRef.current % settings.chopSlices.interval === 0) {
            const numSlices = Math.max(1, Math.round(settings.chopSlices.sliceCount * 0.6))
            const maxShift = settings.chopSlices.maxDisplacement * 0.5
            for (let i = 0; i < numSlices; i++) {
              const sy = Math.floor(Math.random() * height)
              const sh = Math.floor(Math.random() * (height / 4)) + 3
              const dispX = Math.floor((Math.random() - 0.5) * maxShift * 2)

              ctx.drawImage(canvas, 0, sy, width, sh, dispX, sy, width, sh)
            }
          }
        }
      }

      // 6. Scanlines and Laser line sweep
      if (settings.scanlines.enabled) {
        ctx.fillStyle = `rgba(255, 255, 255, ${settings.scanlines.intensity})`
        for (let y = 0; y < height; y += 4) {
          ctx.fillRect(0, y, width, 1.2)
        }

        if (settings.scanlines.laserSweep) {
          const sweepY = (Date.now() / 15) % (height * 3) - height
          if (sweepY > 0 && sweepY < height) {
            ctx.fillStyle = settings.scanlines.laserColor || 'rgba(0, 255, 255, 0.25)'
            ctx.fillRect(0, sweepY, width, 1.2)
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      active = false
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isHovered, settings, baseImage])

  // Handler for saving changes inside the Studio Modal
  const handleStudioSave = (newSettings, newImage) => {
    setSettings(newSettings)
    setBaseImage(newImage)
  }

  return (
    <>
      <div
        ref={containerRef}
        className="channel-avatar group"
        style={{
          width: '78px',
          height: '78px',
          borderRadius: '20px',
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative',
          background: '#121212',
          boxShadow: isHovered 
            ? '0 0 25px rgba(232, 23, 172, 0.5), 0 8px 16px rgba(103, 58, 183, 0.4)'
            : '0 8px 16px rgba(103, 58, 183, 0.34)',
          transition: 'box-shadow 0.3s ease, transform 0.2s ease',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          display: 'block'
        }}
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Edit Glitch Profile Photo"
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

        {/* Edit Overlay Hover Shield */}
        <div 
          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200"
          style={{ borderRadius: '20px' }}
        >
          <Edit2 className="text-cyan-400 w-5 h-5 animate-pulse mb-0.5" />
          <span className="text-[9px] font-mono tracking-wider text-cyan-300 uppercase">EDIT</span>
        </div>
      </div>

      {/* Embedded Studio Modal Component */}
      <GlitchStudioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleStudioSave}
      />
    </>
  )
}
