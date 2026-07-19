import { useState, useEffect, useRef } from 'react'
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0411]/90 backdrop-blur-md p-4 md:p-6 overflow-y-auto">
      <div 
        id="glitchStudioContainer"
        className="w-full max-w-5xl bg-[#160c1d] border border-fuchsia-500/30 rounded-2xl shadow-[0_0_50px_rgba(232,23,172,0.25)] flex flex-col md:flex-row overflow-hidden max-h-[90vh]"
      >
        
        {/* Left column: Visual Workspace */}
        <div className="md:w-1/2 bg-[#0e0614] p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-fuchsia-500/10 min-h-[380px] md:min-h-[500px]">
          
          {/* Header Title */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 bg-cyan-400 rounded-full animate-ping" />
              <h3 className="font-mono text-cyan-400 tracking-wider text-sm uppercase">Glitchify Image Studio v4</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-fuchsia-400/60 hover:text-fuchsia-400 transition-colors cursor-pointer"
              title="Close Editor"
            >
              <X size={20} />
            </button>
          </div>

          {/* Central Canvas Viewport */}
          <div className="relative my-4 flex flex-col items-center">
            {/* Holographic Frame */}
            <div className="absolute inset-0 border border-cyan-500/30 rounded-2xl pointer-events-none shadow-[0_0_20px_rgba(0,255,255,0.1)]" />
            <div className="absolute -top-3 left-4 bg-[#0e0614] px-2 font-mono text-[10px] text-cyan-400/70">
              PREVIEW_FEED_01
            </div>

            <canvas
              ref={canvasRef}
              className="w-[260px] h-[260px] md:w-[300px] md:h-[300px] rounded-xl object-cover bg-black"
              style={{
                boxShadow: '0 0 30px rgba(0,255,255,0.15)'
              }}
            />

            {/* Quick Play/Pause & Reset controls */}
            <div className="flex gap-4 mt-4 bg-[#160c1d]/90 border border-fuchsia-500/20 px-3 py-1.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              <button
                onClick={() => setIsAnimating(!isAnimating)}
                className="text-cyan-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-mono cursor-pointer"
                title={isAnimating ? "Pause Animation" : "Play Animation"}
              >
                {isAnimating ? <Pause size={14} /> : <Play size={14} />}
                <span>{isAnimating ? "PAUSE" : "PLAY"}</span>
              </button>
              <span className="text-fuchsia-500/30">|</span>
              <button
                onClick={() => handleSelectPreset('Default Lab')}
                className="text-fuchsia-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-mono cursor-pointer"
                title="Reset Settings"
              >
                <RotateCcw size={14} />
                <span>RESET</span>
              </button>
            </div>
          </div>

          {/* Presets List */}
          <div className="w-full">
            <p className="font-mono text-[10px] text-fuchsia-400/50 uppercase tracking-widest mb-2">Preset Matrix</p>
            <div className="grid grid-cols-3 gap-1.5 w-full">
              {Object.keys(PRESETS).map((pname) => (
                <button
                  key={pname}
                  onClick={() => handleSelectPreset(pname)}
                  className={`px-2 py-1.5 rounded text-[10px] font-mono tracking-tighter uppercase transition-all duration-200 cursor-pointer ${
                    activePreset === pname
                      ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)] border border-cyan-400'
                      : 'bg-[#180a22] text-fuchsia-400/80 hover:bg-[#250d35] hover:text-white border border-fuchsia-500/15'
                  }`}
                >
                  {pname}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right column: Form Settings controls */}
        <div className="md:w-1/2 p-6 overflow-y-auto max-h-[50vh] md:max-h-[90vh] flex flex-col justify-between bg-[#130919]">
          
          <div className="space-y-4">
            
            {/* Header section toggle: Image IO */}
            <div className="border border-fuchsia-500/10 rounded-lg overflow-hidden bg-[#1a0c24]/30">
              <button 
                onClick={() => toggleCollapse('io')}
                className="w-full flex items-center justify-between p-3 font-mono text-xs uppercase tracking-widest text-fuchsia-400 border-b border-fuchsia-500/10 hover:bg-fuchsia-500/5 cursor-pointer"
              >
                <span>Image Input / Output</span>
                <span>{collapses.io ? '⊟' : '⊞'}</span>
              </button>
              
              {collapses.io && (
                <div className="p-3 space-y-3 font-mono text-xs text-fuchsia-400/90">
                  <div className="flex gap-2">
                    <button
                      onClick={handleUploadClick}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#2a0e3b] hover:bg-[#3d1455] text-cyan-400 hover:text-white border border-cyan-400/30 px-3 py-2 rounded transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,255,0.05)]"
                    >
                      <Upload size={14} />
                      <span>UPLOAD IMAGE</span>
                    </button>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    
                    {baseImage !== baseAvatarDefault && (
                      <button
                        onClick={handleResetBaseImage}
                        className="bg-red-950/40 hover:bg-red-950 text-red-400 border border-red-500/20 px-2 rounded transition-all cursor-pointer"
                        title="Reset base avatar to original lab logo"
                      >
                        RESET
                      </button>
                    )}
                  </div>
                  
                  <p className="text-[10px] text-fuchsia-400/50">{imageQualityMsg}</p>
                  
                  <div className="border-t border-fuchsia-500/10 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]">Format:</span>
                      <select 
                        value={downloadFormat}
                        onChange={(e) => setDownloadFormat(e.target.value)}
                        className="bg-[#1b0a24] text-cyan-300 border border-cyan-500/20 px-2 py-1 rounded text-[11px] focus:outline-none"
                      >
                        <option value="png">PNG (Lossless)</option>
                        <option value="jpeg">JPEG (Fast)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleDownloadImage}
                      className="w-full flex items-center justify-center gap-1.5 bg-[#0d2a2d] hover:bg-[#123e42] text-cyan-300 border border-cyan-400/40 px-3 py-2 rounded transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,255,0.05)]"
                    >
                      <Download size={14} />
                      <span>DOWNLOAD GLITCHED FRAME</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Header section toggle: Palette Reduction */}
            <div className="border border-fuchsia-500/10 rounded-lg overflow-hidden bg-[#1a0c24]/30">
              <div className="flex items-center justify-between p-3 border-b border-fuchsia-500/10">
                <button 
                  onClick={() => toggleCollapse('palette')}
                  className="flex-1 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-fuchsia-400 hover:bg-fuchsia-500/5 text-left cursor-pointer"
                >
                  <span>Palette Reduction</span>
                  <span>{collapses.palette ? '⊟' : '⊞'}</span>
                </button>
                <input
                  type="checkbox"
                  checked={settings.paletteReduction.enabled}
                  onChange={(e) => updateSetting('paletteReduction', 'enabled', e.target.checked)}
                  className="ml-3 accent-fuchsia-500 h-4 w-4 cursor-pointer"
                />
              </div>

              {collapses.palette && (
                <div className="p-3 space-y-3 font-mono text-xs text-fuchsia-300/80">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Palette preset:</span>
                      <select 
                        value={settings.paletteReduction.palette}
                        onChange={(e) => updateSetting('paletteReduction', 'palette', e.target.value)}
                        className="bg-[#1b0a24] text-cyan-300 border border-cyan-500/20 px-2 py-1 rounded text-[11px] focus:outline-none focus:border-cyan-400"
                        disabled={!settings.paletteReduction.enabled}
                      >
                        {Object.keys(PALETTES).map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Dithering pattern:</span>
                    <input
                      type="checkbox"
                      checked={settings.paletteReduction.dithering}
                      onChange={(e) => updateSetting('paletteReduction', 'dithering', e.target.checked)}
                      className="accent-fuchsia-500 cursor-pointer"
                      disabled={!settings.paletteReduction.enabled}
                    />
                  </div>

                  {settings.paletteReduction.dithering && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Dither Intensity:</span>
                        <span className="text-cyan-400">{settings.paletteReduction.ditherIntensity}</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="30"
                        value={settings.paletteReduction.ditherIntensity}
                        onChange={(e) => updateSetting('paletteReduction', 'ditherIntensity', parseInt(e.target.value))}
                        className="w-full accent-fuchsia-500 bg-[#160c1d] rounded-lg cursor-pointer h-1.5"
                        disabled={!settings.paletteReduction.enabled}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Header section toggle: Color Shift */}
            <div className="border border-fuchsia-500/10 rounded-lg overflow-hidden bg-[#1a0c24]/30">
              <div className="flex items-center justify-between p-3 border-b border-fuchsia-500/10">
                <button 
                  onClick={() => toggleCollapse('colorShift')}
                  className="flex-1 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-fuchsia-400 hover:bg-fuchsia-500/5 text-left cursor-pointer"
                >
                  <span>Color Shift</span>
                  <span>{collapses.colorShift ? '⊟' : '⊞'}</span>
                </button>
                <input
                  type="checkbox"
                  checked={settings.colorShift.enabled}
                  onChange={(e) => updateSetting('colorShift', 'enabled', e.target.checked)}
                  className="ml-3 accent-fuchsia-500 h-4 w-4 cursor-pointer"
                />
              </div>

              {collapses.colorShift && (
                <div className="p-3 space-y-3 font-mono text-xs text-fuchsia-300/80">
                  <div className="flex items-center justify-between">
                    <span>Uniform shift (Chromatic):</span>
                    <input
                      type="checkbox"
                      checked={settings.colorShift.uniformShift}
                      onChange={(e) => updateSetting('colorShift', 'uniformShift', e.target.checked)}
                      className="accent-fuchsia-500 cursor-pointer"
                      disabled={!settings.colorShift.enabled}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Intensity scale:</span>
                      <span className="text-cyan-400">{settings.colorShift.intensity.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.1"
                      value={settings.colorShift.intensity}
                      onChange={(e) => updateSetting('colorShift', 'intensity', parseFloat(e.target.value))}
                      className="w-full accent-fuchsia-500 bg-[#160c1d] rounded-lg cursor-pointer h-1.5"
                      disabled={!settings.colorShift.enabled}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Shift offset:</span>
                      <span className="text-cyan-400">{settings.colorShift.shiftAmount}px</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="50"
                      value={settings.colorShift.shiftAmount}
                      onChange={(e) => updateSetting('colorShift', 'shiftAmount', parseInt(e.target.value))}
                      className="w-full accent-fuchsia-500 bg-[#160c1d] rounded-lg cursor-pointer h-1.5"
                      disabled={!settings.colorShift.enabled}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Header section toggle: Wave Deform */}
            <div className="border border-fuchsia-500/10 rounded-lg overflow-hidden bg-[#1a0c24]/30">
              <div className="flex items-center justify-between p-3 border-b border-fuchsia-500/10">
                <button 
                  onClick={() => toggleCollapse('wave')}
                  className="flex-1 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-fuchsia-400 hover:bg-fuchsia-500/5 text-left cursor-pointer"
                >
                  <span>Wave Deform</span>
                  <span>{collapses.wave ? '⊟' : '⊞'}</span>
                </button>
                <input
                  type="checkbox"
                  checked={settings.waveDeform.enabled}
                  onChange={(e) => updateSetting('waveDeform', 'enabled', e.target.checked)}
                  className="ml-3 accent-fuchsia-500 h-4 w-4 cursor-pointer"
                />
              </div>

              {collapses.wave && (
                <div className="p-3 space-y-3 font-mono text-xs text-fuchsia-300/80">
                  <div className="flex items-center justify-between">
                    <span>Wave Direction:</span>
                    <select 
                      value={settings.waveDeform.direction}
                      onChange={(e) => updateSetting('waveDeform', 'direction', e.target.value)}
                      className="bg-[#1b0a24] text-cyan-300 border border-cyan-500/20 px-2 py-1 rounded text-[11px] focus:outline-none"
                      disabled={!settings.waveDeform.enabled}
                    >
                      <option value="Horizontal">Horizontal rows</option>
                      <option value="Vertical">Vertical columns</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Wave Amplitude (size):</span>
                      <span className="text-cyan-400">{settings.waveDeform.amplitude}px</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="80"
                      value={settings.waveDeform.amplitude}
                      onChange={(e) => updateSetting('waveDeform', 'amplitude', parseInt(e.target.value))}
                      className="w-full accent-fuchsia-500 bg-[#160c1d] rounded-lg cursor-pointer h-1.5"
                      disabled={!settings.waveDeform.enabled}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Wave Frequency (count):</span>
                      <span className="text-cyan-400">{settings.waveDeform.frequency.toFixed(3)}</span>
                    </div>
                    <input 
                      type="range"
                      min="0.005"
                      max="0.25"
                      step="0.005"
                      value={settings.waveDeform.frequency}
                      onChange={(e) => updateSetting('waveDeform', 'frequency', parseFloat(e.target.value))}
                      className="w-full accent-fuchsia-500 bg-[#160c1d] rounded-lg cursor-pointer h-1.5"
                      disabled={!settings.waveDeform.enabled}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Wave speed:</span>
                      <span className="text-cyan-400">{settings.waveDeform.speed}</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="15"
                      value={settings.waveDeform.speed}
                      onChange={(e) => updateSetting('waveDeform', 'speed', parseInt(e.target.value))}
                      className="w-full accent-fuchsia-500 bg-[#160c1d] rounded-lg cursor-pointer h-1.5"
                      disabled={!settings.waveDeform.enabled}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Header section toggle: Slices Displacement */}
            <div className="border border-fuchsia-500/10 rounded-lg overflow-hidden bg-[#1a0c24]/30">
              <div className="flex items-center justify-between p-3 border-b border-fuchsia-500/10">
                <button 
                  onClick={() => toggleCollapse('chop')}
                  className="flex-1 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-fuchsia-400 hover:bg-fuchsia-500/5 text-left cursor-pointer"
                >
                  <span>Chop & Slices Displacement</span>
                  <span>{collapses.chop ? '⊟' : '⊞'}</span>
                </button>
                <input
                  type="checkbox"
                  checked={settings.chopSlices.enabled}
                  onChange={(e) => updateSetting('chopSlices', 'enabled', e.target.checked)}
                  className="ml-3 accent-fuchsia-500 h-4 w-4 cursor-pointer"
                />
              </div>

              {collapses.chop && (
                <div className="p-3 space-y-3 font-mono text-xs text-fuchsia-300/80">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Slice count:</span>
                      <span className="text-cyan-400">{settings.chopSlices.sliceCount}</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="20"
                      value={settings.chopSlices.sliceCount}
                      onChange={(e) => updateSetting('chopSlices', 'sliceCount', parseInt(e.target.value))}
                      className="w-full accent-fuchsia-500 bg-[#160c1d] rounded-lg cursor-pointer h-1.5"
                      disabled={!settings.chopSlices.enabled}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Max shift width:</span>
                      <span className="text-cyan-400">{settings.chopSlices.maxDisplacement}px</span>
                    </div>
                    <input 
                      type="range"
                      min="2"
                      max="100"
                      value={settings.chopSlices.maxDisplacement}
                      onChange={(e) => updateSetting('chopSlices', 'maxDisplacement', parseInt(e.target.value))}
                      className="w-full accent-fuchsia-500 bg-[#160c1d] rounded-lg cursor-pointer h-1.5"
                      disabled={!settings.chopSlices.enabled}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Trigger interval (frames):</span>
                      <span className="text-cyan-400">every {settings.chopSlices.interval} frames</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="30"
                      value={settings.chopSlices.interval}
                      onChange={(e) => updateSetting('chopSlices', 'interval', parseInt(e.target.value))}
                      className="w-full accent-fuchsia-500 bg-[#160c1d] rounded-lg cursor-pointer h-1.5"
                      disabled={!settings.chopSlices.enabled}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Header section toggle: Scanlines / Sweep */}
            <div className="border border-fuchsia-500/10 rounded-lg overflow-hidden bg-[#1a0c24]/30">
              <div className="flex items-center justify-between p-3 border-b border-fuchsia-500/10">
                <button 
                  onClick={() => toggleCollapse('static')}
                  className="flex-1 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-fuchsia-400 hover:bg-fuchsia-500/5 text-left cursor-pointer"
                >
                  <span>Scanlines & Laser Sweep</span>
                  <span>{collapses.static ? '⊟' : '⊞'}</span>
                </button>
                <input
                  type="checkbox"
                  checked={settings.scanlines.enabled}
                  onChange={(e) => updateSetting('scanlines', 'enabled', e.target.checked)}
                  className="ml-3 accent-fuchsia-500 h-4 w-4 cursor-pointer"
                />
              </div>

              {collapses.static && (
                <div className="p-3 space-y-3 font-mono text-xs text-fuchsia-300/80">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Scanline visibility:</span>
                      <span className="text-cyan-400">{(settings.scanlines.intensity * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0.01"
                      max="0.20"
                      step="0.01"
                      value={settings.scanlines.intensity}
                      onChange={(e) => updateSetting('scanlines', 'intensity', parseFloat(e.target.value))}
                      className="w-full accent-fuchsia-500 bg-[#160c1d] rounded-lg cursor-pointer h-1.5"
                      disabled={!settings.scanlines.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Active Laser Sweep:</span>
                    <input
                      type="checkbox"
                      checked={settings.scanlines.laserSweep}
                      onChange={(e) => updateSetting('scanlines', 'laserSweep', e.target.checked)}
                      className="accent-fuchsia-500 cursor-pointer"
                      disabled={!settings.scanlines.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Laser Glow Color:</span>
                    <select 
                      value={settings.scanlines.laserColor}
                      onChange={(e) => updateSetting('scanlines', 'laserColor', e.target.value)}
                      className="bg-[#1b0a24] text-cyan-300 border border-cyan-500/20 px-2 py-1 rounded text-[11px] focus:outline-none"
                      disabled={!settings.scanlines.enabled}
                    >
                      <option value="rgba(0, 255, 255, 0.25)">Laser Cyan</option>
                      <option value="rgba(255, 0, 128, 0.3)">Hot Magenta</option>
                      <option value="rgba(50, 205, 50, 0.35)">Radioactive Green</option>
                      <option value="rgba(255, 255, 255, 0.3)">White Hot</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Dialog Action Footers */}
          <div className="mt-6 flex gap-4 border-t border-fuchsia-500/10 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-transparent hover:bg-white/5 text-fuchsia-400 hover:text-white border border-fuchsia-500/30 font-mono text-xs py-3 rounded-lg transition-colors cursor-pointer"
            >
              DISCARD CHANGES
            </button>
            <button
              onClick={handleSaveAndApply}
              className="flex-1 bg-[#d91ba3] hover:bg-[#ff20bf] text-white font-mono text-xs py-3 rounded-lg transition-all cursor-pointer shadow-[0_0_20px_rgba(232,23,172,0.4)] hover:shadow-[0_0_30px_rgba(232,23,172,0.6)] flex items-center justify-center gap-1.5"
            >
              {showSaveFeedback ? (
                <>
                  <Check size={14} className="animate-bounce" />
                  <span>APPLIED SUCCESSFULLY!</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>SAVE & APPLY TO AVATAR</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
