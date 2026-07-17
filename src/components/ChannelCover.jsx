import { useState, useEffect, useRef } from 'react';
import { Palette, Sparkles, Settings, X, Eye, EyeOff, RotateCw, Check } from 'lucide-react';

const DEFAULT_CONFIG = {
  text: "SIGNAL\n/ NOISE LAB",
  colorText: "#f1593c",
  colorStroke: "#000000",
  colorSticker: "#f2b714",
  colorShadow: "#000000",
  shadowTransparent: false,
  colorBodyBg: "#c97118",
  textSize: 8.5,
  lineHeight: 0.95,
  stickerSize: 54,
  rotation: -6,
  skew: -4
};

function loadHtml2Canvas() {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) {
      resolve(window.html2canvas);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => {
      if (window.html2canvas) {
        resolve(window.html2canvas);
      } else {
        reject(new Error('html2canvas failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load html2canvas'));
    document.head.appendChild(script);
  });
}

export default function ChannelCover() {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('retro_sticker_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_CONFIG;
  });

  // Modal / Editor State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  // Temporary local states for editing inside the designer
  const [text, setText] = useState(config.text);
  const [colorText, setColorText] = useState(config.colorText);
  const [colorStroke, setColorStroke] = useState(config.colorStroke);
  const [colorSticker, setColorSticker] = useState(config.colorSticker);
  const [colorShadow, setColorShadow] = useState(config.colorShadow);
  const [shadowTransparent, setShadowTransparent] = useState(config.shadowTransparent);
  const [colorBodyBg, setColorBodyBg] = useState(config.colorBodyBg);
  const [textSize, setTextSize] = useState(config.textSize);
  const [lineHeight, setLineHeight] = useState(config.lineHeight);
  const [stickerSize, setStickerSize] = useState(config.stickerSize);
  const [rotation, setRotation] = useState(config.rotation);
  const [skew, setSkew] = useState(config.skew);

  const openDesigner = () => {
    setText(config.text);
    setColorText(config.colorText);
    setColorStroke(config.colorStroke);
    setColorSticker(config.colorSticker);
    setColorShadow(config.colorShadow);
    setShadowTransparent(config.shadowTransparent);
    setColorBodyBg(config.colorBodyBg);
    setTextSize(config.textSize);
    setLineHeight(config.lineHeight);
    setStickerSize(config.stickerSize);
    setRotation(config.rotation);
    setSkew(config.skew);
    setIsModalOpen(true);
    setPanelOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const saveChanges = () => {
    const newConfig = {
      text,
      colorText,
      colorStroke,
      colorSticker,
      colorShadow,
      shadowTransparent,
      colorBodyBg,
      textSize,
      lineHeight,
      stickerSize,
      rotation,
      skew
    };
    setConfig(newConfig);
    localStorage.setItem('retro_sticker_config', JSON.stringify(newConfig));
    setIsModalOpen(false);
  };

  const handleExportPNG = async () => {
    try {
      const html2canvas = await loadHtml2Canvas();
      const logoWrapper = document.querySelector('.logo-wrapper-to-export');
      if (!logoWrapper) return;
      
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'fixed';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '-9999px';
      exportContainer.style.backgroundColor = 'transparent';
      exportContainer.style.padding = '80px';
      document.body.appendChild(exportContainer);
      
      const clone = logoWrapper.cloneNode(true);
      clone.style.transform = `rotate(${rotation}deg) skewX(${skew}deg)`;
      clone.style.position = 'relative';
      clone.style.display = 'inline-block';
      exportContainer.appendChild(clone);
      
      const canvas = await html2canvas(exportContainer, {
        scale: 4, // 4x supersampling for extreme high fidelity!
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: exportContainer.scrollWidth,
        height: exportContainer.scrollHeight
      });
      
      document.body.removeChild(exportContainer);
      
      const link = document.createElement('a');
      link.download = `retro-sticker-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export error:', error);
      alert('An error occurred during export. Please try again.');
    }
  };

  // Helper variables for rendering the 3D extrusion text shadow
  const textStyle = {
    fontFamily: "'Montserrat', 'Segoe UI', sans-serif",
    fontWeight: 900,
    textTransform: 'uppercase',
    textAlign: 'center',
  };

  // Public display banner variables
  const publicLines = config.text.split('\n');
  const publicTextShadowString = Array.from({ length: 12 }, (_, idx) => {
    const o = idx + 1;
    // Scale the text shadow based on scale factor so it remains proportional
    return `-${o}px ${o}px 0px ${config.colorStroke}`;
  }).join(', ');

  // Modal design studio variables
  const editorLines = text.split('\n');
  const editorTextShadowString = Array.from({ length: 12 }, (_, idx) => {
    const o = idx + 1;
    return `-${o}px ${o}px 0px ${colorStroke}`;
  }).join(', ');

  return (
    <div id="channel-cover-studio-container" className="w-full relative mb-6 group">
      
      {/* 1. PUBLIC CHANNEL BANNER DISPLAY */}
      <div
        style={{ backgroundColor: config.colorBodyBg }}
        className="w-full h-40 sm:h-48 md:h-56 rounded-2xl overflow-hidden relative shadow-2xl transition duration-300"
      >
        {/* Custom CSS for perfect responsiveness of the public logo banner */}
        <style>{`
          .public-logo-wrapper {
            transform: scale(0.28) rotate(${config.rotation}deg) skewX(${config.skew}deg);
          }
          @media (min-width: 480px) {
            .public-logo-wrapper {
              transform: scale(0.35) rotate(${config.rotation}deg) skewX(${config.skew}deg);
            }
          }
          @media (min-width: 640px) {
            .public-logo-wrapper {
              transform: scale(0.42) rotate(${config.rotation}deg) skewX(${config.skew}deg);
            }
          }
          @media (min-width: 768px) {
            .public-logo-wrapper {
              transform: scale(0.5) rotate(${config.rotation}deg) skewX(${config.skew}deg);
            }
          }
          @media (min-width: 1024px) {
            .public-logo-wrapper {
              transform: scale(0.58) rotate(${config.rotation}deg) skewX(${config.skew}deg);
            }
          }
        `}</style>

        {/* Centered scaled vector logo display */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden select-none">
          <div 
            className="public-logo-wrapper relative inline-block transition-transform duration-300"
            style={{ transformOrigin: 'center' }}
          >
            {/* Background Layer with thick stroke outline & drop-shadow */}
            <div 
              style={{
                ...textStyle,
                color: config.colorSticker,
                WebkitTextStroke: `${config.stickerSize}px ${config.colorSticker}`,
                paintOrder: 'stroke fill',
                filter: config.shadowTransparent ? 'none' : `drop-shadow(-24px 30px 0px ${config.colorShadow})`,
                fontSize: `${config.textSize}rem`,
                lineHeight: config.lineHeight,
                letterSpacing: `${-6 * (config.textSize / 8.5)}px`,
              }}
            >
              {publicLines.map((line, idx) => (
                <div key={idx} style={{ whiteSpace: 'nowrap' }}>
                  {line}
                </div>
              ))}
            </div>

            {/* 3D Extrusion Layer */}
            <div 
              style={{
                ...textStyle,
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 2,
                color: config.colorStroke,
                WebkitTextStroke: `14px ${config.colorStroke}`,
                paintOrder: 'stroke fill',
                textShadow: publicTextShadowString,
                fontSize: `${config.textSize}rem`,
                lineHeight: config.lineHeight,
                letterSpacing: `${-6 * (config.textSize / 8.5)}px`,
                width: '100%',
                height: '100%',
              }}
            >
              {publicLines.map((line, idx) => (
                <div key={idx} style={{ whiteSpace: 'nowrap' }}>
                  {line}
                </div>
              ))}
            </div>

            {/* Front Crisp Text Layer */}
            <div 
              style={{
                ...textStyle,
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 3,
                color: config.colorText,
                WebkitTextStroke: `6px ${config.colorStroke}`,
                paintOrder: 'stroke fill',
                fontSize: `${config.textSize}rem`,
                lineHeight: config.lineHeight,
                letterSpacing: `${-6 * (config.textSize / 8.5)}px`,
                width: '100%',
                height: '100%',
              }}
            >
              {publicLines.map((line, idx) => (
                <div key={idx} style={{ whiteSpace: 'nowrap' }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating action "Customize Cover" button overlay */}
        <button
          onClick={openDesigner}
          className="absolute right-4 bottom-4 bg-[#121216] hover:bg-black text-[#FFE500] hover:text-white text-[10px] uppercase font-extrabold tracking-widest px-3.5 py-2.5 rounded-xl border-2 border-[#FFE500]/40 flex items-center gap-1.5 transition duration-150 shadow-2xl transform active:scale-95 cursor-pointer z-20"
        >
          <Palette size={13} className="text-pink-500" />
          <span>Customize Cover</span>
        </button>
      </div>

      {/* 2. CHROME HIGH-FIDELITY RETRO STICKER STUDIO MODAL OVERLAY */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center p-6 select-none overflow-hidden"
          style={{ backgroundColor: colorBodyBg }}
        >
          {/* Custom CSS for perfect responsiveness of the editor logo wrapper */}
          <style>{`
            .editor-logo-wrapper {
              transform: scale(0.3) rotate(${rotation}deg) skewX(${skew}deg);
            }
            @media (min-width: 480px) {
              .editor-logo-wrapper {
                transform: scale(0.4) rotate(${rotation}deg) skewX(${skew}deg);
              }
            }
            @media (min-width: 640px) {
              .editor-logo-wrapper {
                transform: scale(0.5) rotate(${rotation}deg) skewX(${skew}deg);
              }
            }
            @media (min-width: 768px) {
              .editor-logo-wrapper {
                transform: scale(0.65) rotate(${rotation}deg) skewX(${skew}deg);
              }
            }
            @media (min-width: 1024px) {
              .editor-logo-wrapper {
                transform: scale(0.9) rotate(${rotation}deg) skewX(${skew}deg);
              }
            }
            @media (min-width: 1280px) {
              .editor-logo-wrapper {
                transform: scale(1.0) rotate(${rotation}deg) skewX(${skew}deg);
              }
            }
          `}</style>

          {/* Toggle Panel Button in top-right */}
          <button 
            onClick={() => setPanelOpen(!panelOpen)}
            className="absolute top-6 right-6 z-[100] w-12 h-12 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center transition shadow-lg active:scale-95 cursor-pointer"
            title="Toggle Customization Panel"
          >
            {panelOpen ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>

          {/* Centered main workspace sticker */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div 
              className="editor-logo-wrapper logo-wrapper-to-export relative inline-block transition-transform duration-200"
              style={{ transformOrigin: 'center' }}
            >
              {/* Background Layer with stroke & drop-shadow */}
              <div 
                style={{
                  ...textStyle,
                  color: colorSticker,
                  WebkitTextStroke: `${stickerSize}px ${colorSticker}`,
                  paintOrder: 'stroke fill',
                  filter: shadowTransparent ? 'none' : `drop-shadow(-24px 30px 0px ${colorShadow})`,
                  fontSize: `${textSize}rem`,
                  lineHeight: lineHeight,
                  letterSpacing: `${-6 * (textSize / 8.5)}px`,
                  transition: 'filter 0.2s ease',
                }}
              >
                {editorLines.map((line, idx) => (
                  <div key={idx} style={{ whiteSpace: 'nowrap' }}>
                    {line}
                  </div>
                ))}
              </div>

              {/* 3D Extrusion Layer */}
              <div 
                style={{
                  ...textStyle,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 2,
                  color: colorStroke,
                  WebkitTextStroke: `14px ${colorStroke}`,
                  paintOrder: 'stroke fill',
                  textShadow: editorTextShadowString,
                  fontSize: `${textSize}rem`,
                  lineHeight: lineHeight,
                  letterSpacing: `${-6 * (textSize / 8.5)}px`,
                  width: '100%',
                  height: '100%',
                }}
              >
                {editorLines.map((line, idx) => (
                  <div key={idx} style={{ whiteSpace: 'nowrap' }}>
                    {line}
                  </div>
                ))}
              </div>

              {/* Front Crisp Text Layer */}
              <div 
                style={{
                  ...textStyle,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 3,
                  color: colorText,
                  WebkitTextStroke: `6px ${colorStroke}`,
                  paintOrder: 'stroke fill',
                  fontSize: `${textSize}rem`,
                  lineHeight: lineHeight,
                  letterSpacing: `${-6 * (textSize / 8.5)}px`,
                  width: '100%',
                  height: '100%',
                }}
              >
                {editorLines.map((line, idx) => (
                  <div key={idx} style={{ whiteSpace: 'nowrap' }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating Customization Card (CodePen style panel) */}
          {panelOpen && (
            <div className="absolute right-6 top-24 z-[99] w-[320px] bg-white/95 backdrop-blur-md p-6 rounded-[24px] border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-black/5">
                <h3 className="text-xs font-bold tracking-widest text-black/40 uppercase">Customization</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-black transition text-lg">✕</button>
              </div>

              {/* Text Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Sticker Text</label>
                <textarea
                  rows={2}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl font-bold font-sans text-xs p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  placeholder="GOOD\nMORNING!"
                />
              </div>

              {/* Color Fields */}
              <div className="flex flex-col gap-2.5">
                {[
                  { label: 'Text Color', val: colorText, set: setColorText },
                  { label: 'Stroke & 3D', val: colorStroke, set: setColorStroke },
                  { label: 'Sticker Background', val: colorSticker, set: setColorSticker },
                  { label: 'Drop Shadow', val: colorShadow, set: setColorShadow },
                  { label: 'Page Background', val: colorBodyBg, set: setColorBodyBg }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">{item.label}</label>
                    <div className="relative flex items-center gap-3 h-10 border border-gray-200 rounded-xl px-3 bg-white hover:bg-gray-50 transition cursor-pointer">
                      <input 
                        type="color" 
                        value={item.val} 
                        onChange={(e) => item.set(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-5 h-5 rounded-md border border-black/10 flex-shrink-0" style={{ backgroundColor: item.val }} />
                      <span className="text-xs font-mono text-gray-700 font-medium">{item.val.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shadow Transparent Checkbox */}
              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  type="checkbox"
                  id="shadowTransparent"
                  checked={shadowTransparent}
                  onChange={(e) => setShadowTransparent(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="shadowTransparent" className="text-[10px] font-bold tracking-wider text-gray-400 uppercase cursor-pointer">
                  Shadow Transparent
                </label>
              </div>

              {/* Slider Controls */}
              <div className="space-y-3 pt-2 border-t border-black/5">
                {[
                  { label: 'Text Size', min: 2, max: 12, step: 0.1, val: textSize, set: setTextSize, suffix: 'rem' },
                  { label: 'Line Height', min: 0.6, max: 1.5, step: 0.02, val: lineHeight, set: setLineHeight, suffix: '' },
                  { label: 'Sticker Thickness', min: 10, max: 100, step: 1, val: stickerSize, set: setStickerSize, suffix: 'px' },
                  { label: 'Rotation', min: -30, max: 30, step: 0.5, val: rotation, set: setRotation, suffix: '°' },
                  { label: 'Skew', min: -20, max: 20, step: 0.5, val: skew, set: setSkew, suffix: '°' }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                      <span>{item.label}</span>
                      <span className="text-gray-600">{item.val}{item.suffix}</span>
                    </div>
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      step={item.step}
                      value={item.val}
                      onChange={(e) => item.set(parseFloat(e.target.value))}
                      className="w-full cursor-pointer accent-black h-1 bg-gray-200 rounded-lg appearance-none"
                    />
                  </div>
                ))}
              </div>

              {/* Export and Save Actions */}
              <div className="pt-2 border-t border-black/5 flex flex-col gap-2">
                <button
                  onClick={handleExportPNG}
                  className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition shadow-md active:scale-95 cursor-pointer"
                >
                  Export as PNG
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={closeModal}
                    className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold tracking-wider uppercase transition active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveChanges}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition shadow active:scale-95 cursor-pointer"
                  >
                    Apply Cover
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
