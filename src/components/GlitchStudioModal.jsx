import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Upload, Download, RefreshCw, Sparkles, Check, Play, Pause, RotateCcw } from 'lucide-react'
import baseAvatarDefault from '../assets/images/channel_avatar_glitch_base_1784436675495.jpg'

// Palettes definition for Palette Reduction
export const PALETTES = {
  Desert: [
    [244, 233, 205], // Soft sand
    [224, 122, 95],  // Rust/Terracotta
    [61, 64, 91],    // Slate Blue
    [143, 184, 168], // Sage
    [242, 204, 143], // Ochre
    [40, 20, 10],    // Deep espresso
  ],
  Cyberpunk: [
    [10, 10, 15],     // Obsidian
    [255, 0, 128],    // Neon Pink
    [0, 255, 240],    // Neon Cyan
    [128, 0, 255],    // Hyper Violet
    [255, 255, 255],  // White
  ],
  AcidGreen: [
    [5, 15, 5],       // Void Green
    [15, 80, 15],     // Cyber Forest
    [50, 205, 50],    // Radioactive Lime
    [173, 255, 47],   // Toxic Chartreuse
    [0, 255, 0],      // Acid Laser
  ],
  Gameboy: [
    [15, 56, 15],     // Dark Olive
    [48, 98, 48],     // Medium Forest
    [139, 172, 15],   // Retro Moss
    [155, 188, 15],   // Screen Green
  ],
  Vaporwave: [
    [255, 113, 206],  // Hot Pink
    [1, 205, 254],    // Electric Blue
    [5, 255, 161],    // Acid Mint
    [185, 103, 255],  // Neon Lavender
    [255, 251, 150],  // Soft Lemon
    [43, 14, 82],     // Sunset Purple
  ],
  RetroArcade: [
    [0, 0, 0],        // Black
    [255, 0, 0],      // Pure Red
    [0, 255, 0],      // Pure Green
    [0, 0, 255],      // Pure Blue
    [255, 255, 0],    // Pure Yellow
    [255, 0, 255],    // Pure Magenta
    [0, 255, 255],    // Pure Cyan
    [255, 255, 255]   // Pure White
  ]
}

export const PRESETS = {
  'Default Lab': {
    paletteReduction: { enabled: false, palette: 'Cyberpunk', distance: 'Accurate', dithering: true, ditherIntensity: 12 },
    colorShift: { enabled: true, uniformShift: true, intensity: 1.0, shiftAmount: 14 },
    waveDeform: { enabled: false, direction: 'Horizontal', amplitude: 15, frequency: 0.05, speed: 3 },
    chopSlices: { enabled: true, sliceCount: 6, maxDisplacement: 20, interval: 6 },
    scanlines: { enabled: true, intensity: 0.05, laserSweep: true, laserColor: 'rgba(0, 255, 255, 0.25)' }
  },
  'Mickey Glitch': {
    paletteReduction: { enabled: true, palette: 'Cyberpunk', distance: 'Accurate', dithering: true, ditherIntensity: 15 },
    colorShift: { enabled: true, uniformShift: false, intensity: 1.4, shiftAmount: 24 },
    waveDeform: { enabled: true, direction: 'Horizontal', amplitude: 25, frequency: 0.08, speed: 5 },
    chopSlices: { enabled: true, sliceCount: 11, maxDisplacement: 38, interval: 4 },
    scanlines: { enabled: true, intensity: 0.08, laserSweep: true, laserColor: 'rgba(255, 0, 128, 0.3)' }
  },
  'Retro Arcade': {
    paletteReduction: { enabled: true, palette: 'RetroArcade', distance: 'Accurate', dithering: true, ditherIntensity: 18 },
    colorShift: { enabled: false, uniformShift: true, intensity: 1.0, shiftAmount: 10 },
    waveDeform: { enabled: true, direction: 'Vertical', amplitude: 12, frequency: 0.04, speed: 2 },
    chopSlices: { enabled: false, sliceCount: 4, maxDisplacement: 10, interval: 10 },
    scanlines: { enabled: true, intensity: 0.06, laserSweep: false, laserColor: 'rgba(0, 255, 255, 0.2)' }
  },
  'Vaporwave Horizon': {
    paletteReduction: { enabled: true, palette: 'Vaporwave', distance: 'Accurate', dithering: true, ditherIntensity: 10 },
    colorShift: { enabled: true, uniformShift: true, intensity: 1.1, shiftAmount: 16 },
    waveDeform: { enabled: true, direction: 'Horizontal', amplitude: 18, frequency: 0.03, speed: 1.5 },
    chopSlices: { enabled: true, sliceCount: 5, maxDisplacement: 22, interval: 5 },
    scanlines: { enabled: true, intensity: 0.04, laserSweep: true, laserColor: 'rgba(185, 103, 255, 0.3)' }
  },
  'Toxic Acid': {
    paletteReduction: { enabled: true, palette: 'AcidGreen', distance: 'Accurate', dithering: true, ditherIntensity: 20 },
    colorShift: { enabled: true, uniformShift: false, intensity: 1.8, shiftAmount: 30 },
    waveDeform: { enabled: true, direction: 'Horizontal', amplitude: 35, frequency: 0.12, speed: 7 },
    chopSlices: { enabled: true, sliceCount: 12, maxDisplacement: 45, interval: 3 },
    scanlines: { enabled: true, intensity: 0.09, laserSweep: true, laserColor: 'rgba(50, 205, 50, 0.35)' }
  },
  'Matrix Terminal': {
    paletteReduction: { enabled: true, palette: 'Gameboy', distance: 'Accurate', dithering: true, ditherIntensity: 8 },
    colorShift: { enabled: false, uniformShift: true, intensity: 0.5, shiftAmount: 5 },
    waveDeform: { enabled: true, direction: 'Horizontal', amplitude: 10, frequency: 0.06, speed: 4 },
    chopSlices: { enabled: true, sliceCount: 3, maxDisplacement: 15, interval: 8 },
    scanlines: { enabled: true, intensity: 0.12, laserSweep: true, laserColor: 'rgba(0, 255, 0, 0.4)' }
  }
}

const selectStyle = {
  background: '#120513',
  color: '#ebdcb9',
  border: '1px solid #35203a',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontFamily: '"JetBrains Mono", monospace',
  height: '28px',
  minHeight: '28px',
  lineHeight: '1.2',
  width: 'auto',
  appearance: 'auto',
  display: 'inline-block',
  cursor: 'pointer',
  outline: 'none',
}

const checkboxStyle = {
  width: '14px',
  height: '14px',
  minHeight: 'auto',
  accentColor: '#d91ba3',
  cursor: 'pointer',
  display: 'inline-block'
}

const rangeStyle = {
  height: '4px',
  minHeight: 'auto',
  accentColor: '#d91ba3',
  cursor: 'pointer',
  background: '#120513',
  borderRadius: '2px',
  width: '100%',
  display: 'block'
}

export default function GlitchStudioModal({ isOpen, onClose, onSave }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('glitch_studio_settings')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        // use default
      }
    }
    return JSON.parse(JSON.stringify(PRESETS['Default Lab']))
  })

  const [activePreset, setActivePreset] = useState('Default Lab')
  const [baseImage, setBaseImage] = useState(() => {
    return localStorage.getItem('glitch_studio_custom_image') || baseAvatarDefault
  })

  const [isAnimating, setIsAnimating] = useState(true)
  const [showSaveFeedback, setShowSaveFeedback] = useState(false)
  const [imageQualityMsg, setImageQualityMsg] = useState('Default resolution: 300x300 canvas')
  const [downloadFormat, setDownloadFormat] = useState('png')

  // Section collapses state
  const [collapses, setCollapses] = useState({
    io: true,
    palette: true,
    colorShift: true,
    wave: true,
    chop: true,
    static: true
  })

  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageObjRef = useRef(null)
  const animationRef = useRef(null)
  const timeRef = useRef(0)
  const frameCountRef = useRef(0)

  // Pre-load current base image whenever it changes
  useEffect(() => {
    const img = new Image()
    img.src = baseImage
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageObjRef.current = img
      setImageQualityMsg(`Image: ${img.naturalWidth}x${img.naturalHeight} loaded`)
    }
    img.onerror = () => {
      // Fallback
      img.src = baseAvatarDefault
    }
  }, [baseImage])

  // Canvas render animation loop
  useEffect(() => {
    if (!isOpen) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const width = 300
    const height = 300
    canvas.width = width
    canvas.height = height

    let active = true

    const renderFrame = () => {
      if (!active) return

      frameCountRef.current++
      if (isAnimating) {
        timeRef.current += 0.05
      }

      // 1. Draw base image or fallback background
      if (imageObjRef.current) {
        ctx.drawImage(imageObjRef.current, 0, 0, width, height)
      } else {
        const grad = ctx.createLinearGradient(0, 0, width, height)
        grad.addColorStop(0, '#2a0e35')
        grad.addColorStop(1, '#15061c')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, width, height)
        
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 36px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('LOADING...', width / 2, height / 2)
      }

      // 2. Apply Palette Reduction (with ordered dithering)
      if (settings.paletteReduction.enabled) {
        const pal = PALETTES[settings.paletteReduction.palette] || PALETTES.Cyberpunk
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
              const ditherValue = (threshold - 7.5) * settings.paletteReduction.ditherIntensity
              r = Math.max(0, Math.min(255, r + ditherValue))
              g = Math.max(0, Math.min(255, g + ditherValue))
              b = Math.max(0, Math.min(255, b + ditherValue))
            }

            // Find closest palette color
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
      }

      // 3. Apply Chromatic Aberration / Color Shift
      if (settings.colorShift.enabled) {
        const imgData = ctx.getImageData(0, 0, width, height)
        const data = imgData.data
        const outData = ctx.createImageData(width, height)
        const out = outData.data

        const shift = Math.round(settings.colorShift.shiftAmount * settings.colorShift.intensity)
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
      }

      // 4. Apply Wave Deform
      if (settings.waveDeform.enabled) {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = width
        tempCanvas.height = height
        const tempCtx = tempCanvas.getContext('2d')
        tempCtx.drawImage(canvas, 0, 0)

        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, width, height)

        if (settings.waveDeform.direction === 'Horizontal') {
          for (let y = 0; y < height; y++) {
            const offset = Math.sin(y * settings.waveDeform.frequency + timeRef.current * settings.waveDeform.speed) * settings.waveDeform.amplitude
            ctx.drawImage(tempCanvas, 0, y, width, 1, offset, y, width, 1)
          }
        } else {
          for (let x = 0; x < width; x++) {
            const offset = Math.sin(x * settings.waveDeform.frequency + timeRef.current * settings.waveDeform.speed) * settings.waveDeform.amplitude
            ctx.drawImage(tempCanvas, x, 0, 1, height, x, offset, 1, height)
          }
        }
      }

      // 5. Apply Horizontal Chop Slices
      if (settings.chopSlices.enabled) {
        // Trigger slice shift every [settings.chopSlices.interval] frames
        if (frameCountRef.current % settings.chopSlices.interval === 0 || !isAnimating) {
          const numSlices = settings.chopSlices.sliceCount
          for (let i = 0; i < numSlices; i++) {
            const sy = Math.floor(Math.random() * height)
            const sh = Math.floor(Math.random() * (height / 3)) + 4
            const dispX = Math.floor((Math.random() - 0.5) * settings.chopSlices.maxDisplacement * 2)

            ctx.drawImage(canvas, 0, sy, width, sh, dispX, sy, width, sh)
          }
        }
      }

      // 6. Draw scanlines and laser line sweep
      if (settings.scanlines.enabled) {
        ctx.fillStyle = `rgba(255, 255, 255, ${settings.scanlines.intensity})`
        for (let y = 0; y < height; y += 4) {
          ctx.fillRect(0, y, width, 1.5)
        }

        if (settings.scanlines.laserSweep) {
          const sweepY = (Date.now() / 15) % (height * 3) - height
          if (sweepY > 0 && sweepY < height) {
            ctx.fillStyle = settings.scanlines.laserColor || 'rgba(0, 255, 255, 0.25)'
            ctx.fillRect(0, sweepY, width, 1.5)
            const subtleLaser = (settings.scanlines.laserColor || 'rgba(0, 255, 255, 0.25)')
              .replace('0.25', '0.08').replace('0.3', '0.1').replace('0.4', '0.15').replace('0.35', '0.12')
            ctx.fillStyle = subtleLaser
            ctx.fillRect(0, sweepY - 2, width, 5)
          }
        }
      }

      animationRef.current = requestAnimationFrame(renderFrame)
    }

    renderFrame()

    return () => {
      active = false
      cancelAnimationFrame(animationRef.current)
    }
  }, [isOpen, settings, isAnimating, baseImage])

  if (!isOpen) return null

  // Handle Preset select
  const handleSelectPreset = (presetName) => {
    setActivePreset(presetName)
    setSettings(JSON.parse(JSON.stringify(PRESETS[presetName])))
  }

  // Handle Custom Image upload and resize it
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Resize down to 300x300 max to keep LocalStorage small and prevent crashes
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = 300
        tempCanvas.height = 300
        const tempCtx = tempCanvas.getContext('2d')
        tempCtx.drawImage(img, 0, 0, 300, 300)
        
        const base64Data = tempCanvas.toDataURL('image/jpeg', 0.85)
        setBaseImage(base64Data)
        localStorage.setItem('glitch_studio_custom_image', base64Data)
      }
      img.src = event.target?.result
    }
    reader.readAsDataURL(file)
  }

  const handleResetBaseImage = () => {
    setBaseImage(baseAvatarDefault)
    localStorage.removeItem('glitch_studio_custom_image')
  }

  // Download active canvas
  const handleDownloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const format = downloadFormat === 'jpeg' ? 'image/jpeg' : 'image/png'
    const ext = downloadFormat === 'jpeg' ? 'jpg' : 'png'
    const link = document.createElement('a')
    link.download = `glitch_noise_lab_avatar.${ext}`
    link.href = canvas.toDataURL(format, 0.95)
    link.click()
  }

  // Save changes back to main avatar
  const handleSaveAndApply = () => {
    localStorage.setItem('glitch_studio_settings', JSON.stringify(settings))
    setShowSaveFeedback(true)
    onSave?.(settings, baseImage)
    setTimeout(() => {
      setShowSaveFeedback(false)
      onClose()
    }, 1200)
  }

  const toggleCollapse = (section) => {
    setCollapses(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Sliders updater helper
  const updateSetting = (group, key, val) => {
    setActivePreset('Custom')
    setSettings(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: val
      }
    }))
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 overflow-y-auto font-mono">
      <div 
        id="glitchStudioContainer"
        className="w-full max-w-5xl bg-[#1c0e18] border-2 border-[#35203a] rounded-none shadow-[0_0_60px_rgba(217,27,163,0.2)] flex flex-row overflow-hidden max-h-[92vh] mx-auto"
      >
        
        {/* Left column: Visual Workspace */}
        <div className="w-[45%] bg-[#120a13] p-5 flex flex-col items-center justify-between border-r-2 border-[#35203a] min-h-[550px]">
          
          {/* Header Title */}
          <div className="w-full flex items-center justify-between border-b border-[#35203a] pb-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-[#ebdcb9] rounded-full animate-pulse" />
              <h3 className="font-mono text-[#ebdcb9] font-bold tracking-wider text-xs uppercase">GLITCHIFY_IMAGE_STUDIO_v4</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-[#ebdcb9]/40 hover:text-[#ebdcb9] transition-colors cursor-pointer"
              title="Close Editor"
            >
              <X size={18} />
            </button>
          </div>

          {/* Central Canvas Viewport */}
          <div className="relative my-4 flex flex-col items-center">
            {/* Holographic Frame */}
            <div className="absolute inset-0 border border-[#ebdcb9]/20 rounded-none pointer-events-none shadow-[0_0_20px_rgba(235,220,185,0.05)]" />
            <div className="absolute -top-2.5 left-4 bg-[#120a13] px-2 font-mono text-[9px] text-[#ebdcb9]/50 tracking-wider">
              MONITOR_FEED_01
            </div>

            <canvas
              ref={canvasRef}
              className="w-[300px] h-[300px] rounded-none object-cover bg-black"
              style={{
                boxShadow: '0 0 40px rgba(0,0,0,0.6), 0 0 15px rgba(235,220,185,0.05)'
              }}
            />

            {/* Quick Play/Pause & Reset controls */}
            <div className="flex gap-4 mt-4 bg-[#1b111a] border border-[#35203a] px-3 py-1.5 rounded-none shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
              <button
                onClick={() => setIsAnimating(!isAnimating)}
                className="text-[#ebdcb9] hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono font-bold cursor-pointer"
                title={isAnimating ? "Pause Animation" : "Play Animation"}
              >
                {isAnimating ? <Pause size={12} /> : <Play size={12} />}
                <span>{isAnimating ? "PAUSE" : "PLAY"}</span>
              </button>
              <span className="text-[#35203a]">|</span>
              <button
                onClick={() => handleSelectPreset('Default Lab')}
                className="text-[#ebdcb9]/60 hover:text-[#ebdcb9] transition-colors flex items-center gap-1 text-[10px] font-mono cursor-pointer"
                title="Reset Settings"
              >
                <RotateCcw size={12} />
                <span>RESET</span>
              </button>
            </div>
          </div>

          {/* Presets List */}
          <div className="w-full border-t border-[#35203a] pt-4">
            <p className="font-mono text-[9px] text-[#ebdcb9]/40 uppercase tracking-widest mb-2.5 font-bold">Preset Matrix</p>
            <div className="grid grid-cols-3 gap-1.5 w-full">
              {Object.keys(PRESETS).map((pname) => (
                <button
                  key={pname}
                  onClick={() => handleSelectPreset(pname)}
                  className={`px-2 py-1.5 rounded-none font-mono text-[9px] tracking-tight uppercase transition-all duration-200 cursor-pointer text-center ${
                    activePreset === pname
                      ? 'bg-[#ebdcb9] text-black font-bold shadow-[0_0_12px_rgba(235,220,185,0.3)] border border-[#ebdcb9]'
                      : 'bg-[#180a22] text-[#ebdcb9]/80 hover:bg-[#250d35] hover:text-white border border-[#35203a]'
                  }`}
                >
                  {pname}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right column: Form Settings controls */}
        <div 
          className="w-[55%] overflow-y-auto max-h-[92vh] flex flex-col justify-between bg-[#2d1c2d] glitch-studio-right-panel"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#4a2b4b #2d1c2d' }}
        >
          <style>{`
            .glitch-studio-right-panel {
              background-color: #2d1c2d !important;
              font-family: "JetBrains Mono", monospace !important;
            }
            .glitch-studio-right-panel::-webkit-scrollbar {
              width: 6px;
            }
            .glitch-studio-right-panel::-webkit-scrollbar-track {
              background: #211322;
            }
            .glitch-studio-right-panel::-webkit-scrollbar-thumb {
              background: #4a2b4b;
            }
            .glitch-studio-header-row {
              background-color: #211322 !important;
              border-top: 1px solid #3e273e !important;
              border-bottom: 1px solid #3e273e !important;
              color: #ebdcb9 !important;
              font-size: 11px !important;
              text-transform: none !important;
              letter-spacing: 0.02em !important;
              height: 30px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              padding: 0 12px !important;
              font-weight: bold !important;
              user-select: none !important;
            }
            .glitch-studio-field-row {
              border-bottom: 1px solid #3e273e !important;
              display: flex !important;
              align-items: stretch !important;
              min-height: 30px !important;
              font-size: 11px !important;
              background-color: #2d1c2d !important;
            }
            .glitch-studio-field-label {
              width: 140px !important;
              flex-shrink: 0 !important;
              border-right: 1px solid #3e273e !important;
              padding: 6px 12px !important;
              color: #a080a0 !important;
              display: flex !important;
              align-items: center !important;
              font-size: 11px !important;
              user-select: none !important;
            }
            .glitch-studio-field-control {
              flex-grow: 1 !important;
              padding: 6px 12px !important;
              display: flex !important;
              align-items: center !important;
              color: #ebdcb9 !important;
              background-color: #2d1c2d !important;
            }
            .glitch-studio-btn-beige {
              background-color: #ebdcb9 !important;
              color: #2d1c2d !important;
              font-size: 11px !important;
              font-weight: bold !important;
              border: none !important;
              border-radius: 0px !important;
              padding: 4px 10px !important;
              transition: all 0.1s ease-in-out !important;
              text-transform: uppercase !important;
              letter-spacing: 0.05em !important;
              cursor: pointer !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              gap: 6px !important;
              font-family: "JetBrains Mono", monospace !important;
            }
            .glitch-studio-btn-beige:hover {
              background-color: #fcf1d8 !important;
              box-shadow: 0 0 10px rgba(235, 220, 185, 0.4) !important;
            }
            .glitch-studio-select {
              background-color: #211322 !important;
              color: #ebdcb9 !important;
              border: 1px solid #ebdcb9 !important;
              border-radius: 0px !important;
              font-size: 11px !important;
              padding: 2px 6px !important;
              font-family: "JetBrains Mono", monospace !important;
              cursor: pointer !important;
              outline: none !important;
              height: 22px !important;
              width: 100% !important;
            }
            .glitch-studio-select:hover {
              border-color: #ebdcb9 !important;
            }
            .glitch-studio-checkbox {
              width: 12px !important;
              height: 12px !important;
              border: 1px solid #ebdcb9 !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              cursor: pointer !important;
              background-color: #211322 !important;
            }
            .glitch-studio-checkbox-checked {
              width: 6px !important;
              height: 6px !important;
              background-color: #ebdcb9 !important;
            }
            .glitch-studio-range {
              -webkit-appearance: none !important;
              width: 100% !important;
              background: transparent !important;
              outline: none !important;
            }
            .glitch-studio-range::-webkit-slider-runnable-track {
              width: 100% !important;
              height: 2px !important;
              cursor: pointer !important;
              background: #3e273e !important;
            }
            .glitch-studio-range::-webkit-slider-thumb {
              height: 10px !important;
              width: 10px !important;
              background: #ebdcb9 !important;
              cursor: pointer !important;
              -webkit-appearance: none !important;
              margin-top: -4px !important;
              border-radius: 0px !important;
            }
            .glitch-studio-range::-moz-range-track {
              width: 100% !important;
              height: 2px !important;
              cursor: pointer !important;
              background: #3e273e !important;
            }
            .glitch-studio-range::-moz-range-thumb {
              height: 10px !important;
              width: 10px !important;
              background: #ebdcb9 !important;
              cursor: pointer !important;
              border-radius: 0px !important;
              border: none !important;
            }
          `}</style>
          
          <div className="flex-1">
            
            {/* Image I/O Section */}
            <div className="border-b border-[#3e273e]">
              <div 
                onClick={() => toggleCollapse('io')}
                className="glitch-studio-header-row cursor-pointer"
              >
                <span>Image I/O</span>
                <span className="text-[#8c698e]">()</span>
              </div>
              
              {collapses.io && (
                <div className="bg-[#2d1c2d]">
                  {/* Upload Image Button */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label"></div>
                    <div className="glitch-studio-field-control py-1">
                      <button
                        onClick={handleUploadClick}
                        className="glitch-studio-btn-beige w-full"
                      >
                        <Upload size={12} />
                        <span>Upload Image</span>
                      </button>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  {/* Image Quality Info */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Image Quality</div>
                    <div className="glitch-studio-field-control text-[#ebdcb9]/80 text-[10px]">
                      {imageQualityMsg}
                    </div>
                  </div>

                  {/* Download Image Button */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label"></div>
                    <div className="glitch-studio-field-control py-1">
                      <button
                        onClick={handleDownloadImage}
                        className="glitch-studio-btn-beige w-full"
                      >
                        <Download size={12} />
                        <span>Download Image</span>
                      </button>
                    </div>
                  </div>

                  {/* Format Selector */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Format</div>
                    <div className="glitch-studio-field-control">
                      <select 
                        value={downloadFormat}
                        onChange={(e) => setDownloadFormat(e.target.value)}
                        className="glitch-studio-select"
                      >
                        <option value="png">PNG</option>
                        <option value="jpeg">JPEG</option>
                      </select>
                    </div>
                  </div>

                  {/* Status row */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label"></div>
                    <div className="glitch-studio-field-control text-[#8c698e] text-[10px]">
                      Idle
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* General Settings Divider Header */}
            <div className="glitch-studio-header-row">
              <span>Settings</span>
              <span className="text-[#8c698e]">||</span>
            </div>

            {/* Palette Reduction Section */}
            <div className="border-b border-[#3e273e]">
              <div 
                onClick={() => toggleCollapse('palette')}
                className="glitch-studio-header-row cursor-pointer"
              >
                <span>Palette Reduction</span>
                <span className="text-[#8c698e]">()</span>
              </div>

              {collapses.palette && (
                <div className="bg-[#2d1c2d]">
                  {/* Enable Switch */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Enable</div>
                    <div className="glitch-studio-field-control">
                      <div 
                        onClick={() => updateSetting('paletteReduction', 'enabled', !settings.paletteReduction.enabled)}
                        className="glitch-studio-checkbox"
                      >
                        {settings.paletteReduction.enabled && <div className="glitch-studio-checkbox-checked" />}
                      </div>
                    </div>
                  </div>

                  {/* Palette Selector */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Palette</div>
                    <div className="glitch-studio-field-control">
                      <select 
                        value={settings.paletteReduction.palette}
                        onChange={(e) => updateSetting('paletteReduction', 'palette', e.target.value)}
                        className="glitch-studio-select disabled:opacity-40"
                        disabled={!settings.paletteReduction.enabled}
                      >
                        {Object.keys(PALETTES).map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Distance Selector */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Distance</div>
                    <div className="glitch-studio-field-control">
                      <select 
                        value={settings.paletteReduction.distance || 'Accurate'}
                        onChange={(e) => updateSetting('paletteReduction', 'distance', e.target.value)}
                        className="glitch-studio-select disabled:opacity-40"
                        disabled={!settings.paletteReduction.enabled}
                      >
                        <option value="Accurate">Accurate</option>
                        <option value="Fast">Fast</option>
                      </select>
                    </div>
                  </div>

                  {/* Dithering Switch */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Dithering</div>
                    <div className="glitch-studio-field-control">
                      <div 
                        onClick={() => {
                          if (settings.paletteReduction.enabled) {
                            updateSetting('paletteReduction', 'dithering', !settings.paletteReduction.dithering);
                          }
                        }}
                        className={`glitch-studio-checkbox ${!settings.paletteReduction.enabled ? 'opacity-40' : ''}`}
                      >
                        {settings.paletteReduction.dithering && <div className="glitch-studio-checkbox-checked" />}
                      </div>
                    </div>
                  </div>

                  {/* Dither Intensity Slider */}
                  {settings.paletteReduction.dithering && (
                    <div className="glitch-studio-field-row">
                      <div className="glitch-studio-field-label">Dither Intensity</div>
                      <div className="glitch-studio-field-control gap-3">
                        <input 
                          type="range"
                          min="1"
                          max="30"
                          value={settings.paletteReduction.ditherIntensity}
                          onChange={(e) => updateSetting('paletteReduction', 'ditherIntensity', parseInt(e.target.value))}
                          className="glitch-studio-range flex-1 disabled:opacity-40"
                          disabled={!settings.paletteReduction.enabled}
                        />
                        <span className="text-[11px] w-8 text-right text-[#ebdcb9] font-bold">
                          {settings.paletteReduction.ditherIntensity}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Color Shift Section */}
            <div className="border-b border-[#3e273e]">
              <div 
                onClick={() => toggleCollapse('colorShift')}
                className="glitch-studio-header-row cursor-pointer"
              >
                <span>Color Shift</span>
                <span className="text-[#8c698e]">()</span>
              </div>

              {collapses.colorShift && (
                <div className="bg-[#2d1c2d]">
                  {/* Enable Switch */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Enable</div>
                    <div className="glitch-studio-field-control">
                      <div 
                        onClick={() => updateSetting('colorShift', 'enabled', !settings.colorShift.enabled)}
                        className="glitch-studio-checkbox"
                      >
                        {settings.colorShift.enabled && <div className="glitch-studio-checkbox-checked" />}
                      </div>
                    </div>
                  </div>

                  {/* Uniform Shift Switch */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Uniform Shift</div>
                    <div className="glitch-studio-field-control">
                      <div 
                        onClick={() => {
                          if (settings.colorShift.enabled) {
                            updateSetting('colorShift', 'uniformShift', !settings.colorShift.uniformShift);
                          }
                        }}
                        className={`glitch-studio-checkbox ${!settings.colorShift.enabled ? 'opacity-40' : ''}`}
                      >
                        {settings.colorShift.uniformShift && <div className="glitch-studio-checkbox-checked" />}
                      </div>
                    </div>
                  </div>

                  {/* Intensity Slider */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Intensity</div>
                    <div className="glitch-studio-field-control gap-3">
                      <input 
                        type="range"
                        min="0.1"
                        max="3.0"
                        step="0.1"
                        value={settings.colorShift.intensity}
                        onChange={(e) => updateSetting('colorShift', 'intensity', parseFloat(e.target.value))}
                        className="glitch-studio-range flex-1 disabled:opacity-40"
                        disabled={!settings.colorShift.enabled}
                      />
                      <span className="text-[11px] w-8 text-right text-[#ebdcb9] font-bold">
                        {settings.colorShift.intensity.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Shift offset Slider (Shift Amount in CodePen) */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Shift Amount</div>
                    <div className="glitch-studio-field-control gap-3">
                      <input 
                        type="range"
                        min="1"
                        max="50"
                        value={settings.colorShift.shiftAmount}
                        onChange={(e) => updateSetting('colorShift', 'shiftAmount', parseInt(e.target.value))}
                        className="glitch-studio-range flex-1 disabled:opacity-40"
                        disabled={!settings.colorShift.enabled}
                      />
                      <span className="text-[11px] w-8 text-right text-[#ebdcb9] font-bold">
                        {settings.colorShift.shiftAmount}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wave Deform Section */}
            <div className="border-b border-[#3e273e]">
              <div 
                onClick={() => toggleCollapse('wave')}
                className="glitch-studio-header-row cursor-pointer"
              >
                <span>Wave Deform</span>
                <span className="text-[#8c698e]">()</span>
              </div>

              {collapses.wave && (
                <div className="bg-[#2d1c2d]">
                  {/* Enable Switch */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Enable</div>
                    <div className="glitch-studio-field-control">
                      <div 
                        onClick={() => updateSetting('waveDeform', 'enabled', !settings.waveDeform.enabled)}
                        className="glitch-studio-checkbox"
                      >
                        {settings.waveDeform.enabled && <div className="glitch-studio-checkbox-checked" />}
                      </div>
                    </div>
                  </div>

                  {/* Wave Direction */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Direction</div>
                    <div className="glitch-studio-field-control">
                      <select 
                        value={settings.waveDeform.direction}
                        onChange={(e) => updateSetting('waveDeform', 'direction', e.target.value)}
                        className="glitch-studio-select disabled:opacity-40"
                        disabled={!settings.waveDeform.enabled}
                      >
                        <option value="Horizontal">Horizontal</option>
                        <option value="Vertical">Vertical</option>
                      </select>
                    </div>
                  </div>

                  {/* Wave Amplitude Slider */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Amplitude</div>
                    <div className="glitch-studio-field-control gap-3">
                      <input 
                        type="range"
                        min="1"
                        max="80"
                        value={settings.waveDeform.amplitude}
                        onChange={(e) => updateSetting('waveDeform', 'amplitude', parseInt(e.target.value))}
                        className="glitch-studio-range flex-1 disabled:opacity-40"
                        disabled={!settings.waveDeform.enabled}
                      />
                      <span className="text-[11px] w-8 text-right text-[#ebdcb9] font-bold">
                        {settings.waveDeform.amplitude}
                      </span>
                    </div>
                  </div>

                  {/* Wave Frequency Slider */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Frequency</div>
                    <div className="glitch-studio-field-control gap-3">
                      <input 
                        type="range"
                        min="0.005"
                        max="0.25"
                        step="0.005"
                        value={settings.waveDeform.frequency}
                        onChange={(e) => updateSetting('waveDeform', 'frequency', parseFloat(e.target.value))}
                        className="glitch-studio-range flex-1 disabled:opacity-40"
                        disabled={!settings.waveDeform.enabled}
                      />
                      <span className="text-[11px] w-8 text-right text-[#ebdcb9] font-bold">
                        {settings.waveDeform.frequency.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* Wave Speed Slider */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Wave Speed</div>
                    <div className="glitch-studio-field-control gap-3">
                      <input 
                        type="range"
                        min="0"
                        max="15"
                        value={settings.waveDeform.speed}
                        onChange={(e) => updateSetting('waveDeform', 'speed', parseInt(e.target.value))}
                        className="glitch-studio-range flex-1 disabled:opacity-40"
                        disabled={!settings.waveDeform.enabled}
                      />
                      <span className="text-[11px] w-8 text-right text-[#ebdcb9] font-bold">
                        {settings.waveDeform.speed}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chop & Slices Displacement Section */}
            <div className="border-b border-[#3e273e]">
              <div 
                onClick={() => toggleCollapse('chop')}
                className="glitch-studio-header-row cursor-pointer"
              >
                <span>Chop & Slices Displacement</span>
                <span className="text-[#8c698e]">()</span>
              </div>

              {collapses.chop && (
                <div className="bg-[#2d1c2d]">
                  {/* Enable Switch */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Enable</div>
                    <div className="glitch-studio-field-control">
                      <div 
                        onClick={() => updateSetting('chopSlices', 'enabled', !settings.chopSlices.enabled)}
                        className="glitch-studio-checkbox"
                      >
                        {settings.chopSlices.enabled && <div className="glitch-studio-checkbox-checked" />}
                      </div>
                    </div>
                  </div>

                  {/* Slice Count Slider */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Slice Count</div>
                    <div className="glitch-studio-field-control gap-3">
                      <input 
                        type="range"
                        min="1"
                        max="20"
                        value={settings.chopSlices.sliceCount}
                        onChange={(e) => updateSetting('chopSlices', 'sliceCount', parseInt(e.target.value))}
                        className="glitch-studio-range flex-1 disabled:opacity-40"
                        disabled={!settings.chopSlices.enabled}
                      />
                      <span className="text-[11px] w-8 text-right text-[#ebdcb9] font-bold">
                        {settings.chopSlices.sliceCount}
                      </span>
                    </div>
                  </div>

                  {/* Max Shift Width Slider */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Max Shift</div>
                    <div className="glitch-studio-field-control gap-3">
                      <input 
                        type="range"
                        min="2"
                        max="100"
                        value={settings.chopSlices.maxDisplacement}
                        onChange={(e) => updateSetting('chopSlices', 'maxDisplacement', parseInt(e.target.value))}
                        className="glitch-studio-range flex-1 disabled:opacity-40"
                        disabled={!settings.chopSlices.enabled}
                      />
                      <span className="text-[11px] w-8 text-right text-[#ebdcb9] font-bold">
                        {settings.chopSlices.maxDisplacement}
                      </span>
                    </div>
                  </div>

                  {/* Trigger Interval Slider */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Interval</div>
                    <div className="glitch-studio-field-control gap-3">
                      <input 
                        type="range"
                        min="1"
                        max="30"
                        value={settings.chopSlices.interval}
                        onChange={(e) => updateSetting('chopSlices', 'interval', parseInt(e.target.value))}
                        className="glitch-studio-range flex-1 disabled:opacity-40"
                        disabled={!settings.chopSlices.enabled}
                      />
                      <span className="text-[11px] w-8 text-right text-[#ebdcb9] font-bold">
                        {settings.chopSlices.interval}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scanlines & Laser Sweep Section */}
            <div className="border-b border-[#3e273e]">
              <div 
                onClick={() => toggleCollapse('static')}
                className="glitch-studio-header-row cursor-pointer"
              >
                <span>Scanlines & Laser Sweep</span>
                <span className="text-[#8c698e]">()</span>
              </div>

              {collapses.static && (
                <div className="bg-[#2d1c2d]">
                  {/* Enable Switch */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Enable</div>
                    <div className="glitch-studio-field-control">
                      <div 
                        onClick={() => updateSetting('scanlines', 'enabled', !settings.scanlines.enabled)}
                        className="glitch-studio-checkbox"
                      >
                        {settings.scanlines.enabled && <div className="glitch-studio-checkbox-checked" />}
                      </div>
                    </div>
                  </div>

                  {/* Scanline Visibility Slider */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Visibility</div>
                    <div className="glitch-studio-field-control gap-3">
                      <input 
                        type="range"
                        min="0.01"
                        max="0.20"
                        step="0.01"
                        value={settings.scanlines.intensity}
                        onChange={(e) => updateSetting('scanlines', 'intensity', parseFloat(e.target.value))}
                        className="glitch-studio-range flex-1 disabled:opacity-40"
                        disabled={!settings.scanlines.enabled}
                      />
                      <span className="text-[11px] w-8 text-right text-[#ebdcb9] font-bold">
                        {(settings.scanlines.intensity * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Active Laser Sweep Switch */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Active Laser Sweep</div>
                    <div className="glitch-studio-field-control">
                      <div 
                        onClick={() => {
                          if (settings.scanlines.enabled) {
                            updateSetting('scanlines', 'laserSweep', !settings.scanlines.laserSweep);
                          }
                        }}
                        className={`glitch-studio-checkbox ${!settings.scanlines.enabled ? 'opacity-40' : ''}`}
                      >
                        {settings.scanlines.laserSweep && <div className="glitch-studio-checkbox-checked" />}
                      </div>
                    </div>
                  </div>

                  {/* Laser Glow Color */}
                  <div className="glitch-studio-field-row">
                    <div className="glitch-studio-field-label">Laser Glow Color</div>
                    <div className="glitch-studio-field-control">
                      <select 
                        value={settings.scanlines.laserColor}
                        onChange={(e) => updateSetting('scanlines', 'laserColor', e.target.value)}
                        className="glitch-studio-select disabled:opacity-40"
                        disabled={!settings.scanlines.enabled}
                      >
                        <option value="rgba(0, 255, 255, 0.25)">Cyan</option>
                        <option value="rgba(255, 0, 128, 0.3)">Magenta</option>
                        <option value="rgba(50, 205, 50, 0.35)">Green</option>
                        <option value="rgba(255, 255, 255, 0.3)">White</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Dialog Action Footers */}
          <div className="mt-6 flex gap-4 border-t border-[#3e273e] pt-4 bg-[#2d1c2d] pb-2">
            <button
              onClick={onClose}
              className="flex-1 bg-transparent hover:bg-white/5 text-[#ebdcb9] border border-[#ebdcb9]/40 font-mono text-[11px] py-2.5 rounded-none transition-colors cursor-pointer uppercase tracking-wider font-bold"
            >
              DISCARD CHANGES
            </button>
            <button
              onClick={handleSaveAndApply}
              className="flex-1 glitch-studio-btn-beige py-2.5"
            >
              {showSaveFeedback ? (
                <>
                  <Check size={14} className="animate-bounce" />
                  <span>APPLIED SUCCESSFULLY!</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>SAVE & APPLY</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>,
    document.body
  )
}
