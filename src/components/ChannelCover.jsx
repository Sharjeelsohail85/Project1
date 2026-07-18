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
  skew: -4,
  fontFamily: "Lilita One"
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

  const [isEditing, setIsEditing] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const updateConfig = (key, value) => {
    setConfig((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('retro_sticker_config', JSON.stringify(updated));
      return updated;
    });
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
      clone.style.transform = `rotate(${config.rotation}deg) skewX(${config.skew}deg)`;
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

  // Helper function for rendering dynamic fonts and letter spacing
  const getTextStyle = (fontName, size) => {
    let fontStr = "'Lilita One', cursive";
    let weight = 'normal';
    if (fontName === 'Montserrat') {
      fontStr = "'Montserrat', sans-serif";
      weight = 900;
    } else if (fontName === 'Bungee') {
      fontStr = "'Bungee', sans-serif";
    } else if (fontName === 'Fredoka One') {
      fontStr = "'Fredoka One', sans-serif";
    } else if (fontName === 'Pacifico') {
      fontStr = "'Pacifico', cursive";
    }
    
    // adjust letter spacing slightly based on font selection
    let spacing = -4;
    if (fontName === 'Lilita One') spacing = -6;
    else if (fontName === 'Montserrat') spacing = -8;
    else if (fontName === 'Bungee') spacing = -2;
    else if (fontName === 'Fredoka One') spacing = -5;
    else if (fontName === 'Pacifico') spacing = 0;

    return {
      fontFamily: fontStr,
      fontWeight: weight,
      textTransform: 'uppercase',
      textAlign: 'center',
      letterSpacing: `${spacing * (size / 8.5)}px`,
    };
  };

  // Public display banner variables
  const publicLines = config.text.split('\n');
  const publicTextShadowString = Array.from({ length: 12 }, (_, idx) => {
    const o = idx + 1;
    // Scale the text shadow based on scale factor so it remains proportional
    return `-${o}px ${o}px 0px ${config.colorStroke}`;
  }).join(', ');

  return (
    <div id="channel-cover-studio-container" className="w-full relative mb-6 group">
      
      {/* Custom styles for clean, non-obtrusive customizer card scrollbar */}
      <style>{`
        .customizer-card::-webkit-scrollbar {
          width: 6px;
        }
        .customizer-card::-webkit-scrollbar-track {
          background: transparent;
        }
        .customizer-card::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 9999px;
        }
        .customizer-card::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>

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
            className="logo-wrapper-to-export public-logo-wrapper relative inline-block transition-transform duration-300"
            style={{ transformOrigin: 'center' }}
          >
            {/* Background Layer with thick stroke outline & drop-shadow */}
            <div 
              style={{
                ...getTextStyle(config.fontFamily || "Lilita One", config.textSize),
                color: config.colorSticker,
                WebkitTextStroke: `${config.stickerSize}px ${config.colorSticker}`,
                paintOrder: 'stroke fill',
                filter: config.shadowTransparent ? 'none' : `drop-shadow(-24px 30px 0px ${config.colorShadow})`,
                fontSize: `${config.textSize}rem`,
                lineHeight: config.lineHeight,
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
                ...getTextStyle(config.fontFamily || "Lilita One", config.textSize),
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
                ...getTextStyle(config.fontFamily || "Lilita One", config.textSize),
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 3,
                color: config.colorText,
                WebkitTextStroke: `6px ${config.colorStroke}`,
                paintOrder: 'stroke fill',
                fontSize: `${config.textSize}rem`,
                lineHeight: config.lineHeight,
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

        {/* Floating action "Eye Edit Icon" button overlay on top right */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="absolute top-4 right-4 z-20 w-11 h-11 bg-black/85 hover:bg-black text-[#FFE500] rounded-full flex items-center justify-center transition duration-150 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
          title="Customize Cover"
        >
          {isEditing ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {/* 2. OVERLAID DESIGN CUSTOMIZER CARD ON THE RIGHT SIDE */}
      {isEditing && (
        <div className="absolute right-4 top-16 z-30 w-[320px] bg-white p-6 rounded-[32px] border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col gap-4 max-h-[480px] overflow-y-auto customizer-card select-text">
          {/* Header */}
          <div className="flex justify-between items-center pb-2.5 border-b-2 border-black/10 select-none">
            <h3 className="text-[11px] font-black tracking-widest text-black/50 uppercase">Customization</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsHelpOpen(true)}
                className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black font-black text-[10px] flex items-center justify-center transition cursor-pointer"
                title="Help"
              >
                ?
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className="text-gray-400 hover:text-black font-black transition text-sm cursor-pointer p-1"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Text Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-black tracking-widest text-black/60 uppercase">Sticker Text</label>
            <textarea
              rows={2}
              value={config.text}
              onChange={(e) => updateConfig('text', e.target.value)}
              className="w-full bg-[#f3f3f6] hover:bg-[#eef0f4] transition border-2 border-transparent focus:border-black rounded-2xl font-bold font-sans text-sm p-3 focus:outline-none uppercase text-gray-800"
              placeholder="GOOD\nMORNING!"
            />
          </div>

          {/* Font Family Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-black tracking-widest text-black/60 uppercase">Font Family</label>
            <select
              value={config.fontFamily}
              onChange={(e) => updateConfig('fontFamily', e.target.value)}
              className="w-full bg-[#f3f3f6] hover:bg-[#eef0f4] transition border-2 border-transparent focus:border-black rounded-2xl font-bold font-sans text-sm p-3 focus:outline-none cursor-pointer text-gray-800"
            >
              <option value="Lilita One">Lilita One (Bubble Retro)</option>
              <option value="Montserrat">Montserrat (Modern Block)</option>
              <option value="Bungee">Bungee (Heavy Industrial)</option>
              <option value="Fredoka One">Fredoka One (Soft Rounded)</option>
              <option value="Pacifico">Pacifico (Retro Brush Script)</option>
            </select>
          </div>

          {/* Color Fields in Codepen style */}
          <div className="flex flex-col gap-2.5">
            {[
              { label: 'Text Color', key: 'colorText' },
              { label: 'Stroke & 3D', key: 'colorStroke' },
              { label: 'Sticker Background', key: 'colorSticker' },
              { label: 'Drop Shadow', key: 'colorShadow' },
              { label: 'Page Background', key: 'colorBodyBg' }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <label className="text-[13px] font-black tracking-widest text-black/60 uppercase">{item.label}</label>
                <div className="relative flex items-center gap-3 h-10 bg-[#f3f3f6] hover:bg-[#eef0f4] transition rounded-2xl px-3 border-2 border-transparent focus-within:border-black">
                  {/* Hidden Color input overlay */}
                  <div className="relative w-6 h-6 rounded-lg border border-black/15 flex-shrink-0 cursor-pointer overflow-hidden" style={{ backgroundColor: config[item.key] }}>
                    <input 
                      type="color" 
                      value={config[item.key]} 
                      onChange={(e) => updateConfig(item.key, e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 scale-150 cursor-pointer"
                    />
                  </div>
                  {/* Direct Hex input string */}
                  <input 
                    type="text" 
                    value={config[item.key].toUpperCase()} 
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith('#')) val = '#' + val;
                      if (val.length <= 7) {
                        updateConfig(item.key, val);
                      }
                    }}
                    className="flex-1 bg-transparent border-none outline-none font-mono text-sm font-black text-gray-800"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Shadow Transparent Checkbox */}
          <div className="flex items-center gap-2 py-1 select-none cursor-pointer">
            <input
              type="checkbox"
              id="shadowTransparent"
              checked={config.shadowTransparent}
              onChange={(e) => updateConfig('shadowTransparent', e.target.checked)}
              className="w-4 h-4 rounded border-2 border-black text-black focus:ring-black cursor-pointer accent-black"
            />
            <label htmlFor="shadowTransparent" className="text-[13px] font-black tracking-widest text-black/60 uppercase cursor-pointer">
              Shadow Transparent
            </label>
          </div>

          {/* Slider Controls */}
          <div className="space-y-3 pt-3 border-t-2 border-black/10">
            {[
              { label: 'Text Size', min: 2, max: 12, step: 0.1, key: 'textSize', suffix: 'rem' },
              { label: 'Line Height', min: 0.6, max: 1.5, step: 0.02, key: 'lineHeight', suffix: '' },
              { label: 'Sticker Thickness', min: 10, max: 100, step: 1, key: 'stickerSize', suffix: 'px' },
              { label: 'Rotation', min: -30, max: 30, step: 0.5, key: 'rotation', suffix: '°' },
              { label: 'Skew', min: -20, max: 20, step: 0.5, key: 'skew', suffix: '°' }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[13px] font-black tracking-widest text-black/60 uppercase">
                  <span>{item.label}</span>
                  <span className="text-black/70 font-black">{config[item.key]}{item.suffix}</span>
                </div>
                <input
                  type="range"
                  min={item.min}
                  max={item.max}
                  step={item.step}
                  value={config[item.key]}
                  onChange={(e) => updateConfig(item.key, parseFloat(e.target.value))}
                  className="w-full cursor-pointer accent-black h-1.5 bg-[#f3f3f6] rounded-lg appearance-none"
                />
              </div>
            ))}
          </div>

          {/* Export and Save Actions */}
          <div className="pt-3 border-t-2 border-black/10 flex flex-col gap-2">
            <button
              onClick={handleExportPNG}
              className="w-full py-3 bg-[#FFE500] hover:bg-[#FFE500]/90 text-black border-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] rounded-2xl text-xs font-black tracking-widest uppercase transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              Export as PNG
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="w-full py-2.5 bg-black hover:bg-black/90 text-[#FFE500] rounded-xl text-xs font-extrabold tracking-widest uppercase transition shadow active:scale-95 cursor-pointer mt-1"
            >
              Done Editing
            </button>
          </div>
        </div>
      )}

      {/* Help & Info Dialog Overlay */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[28px] border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-md w-full p-6 text-black select-text relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold transition text-lg cursor-pointer p-1"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FFE500] border-[2px] border-black flex items-center justify-center text-lg font-black shadow-[2px_2px_0px_rgba(0,0,0,1)] select-none">
                🎨
              </div>
              <div>
                <h4 className="font-black text-base uppercase tracking-tight">Retro Sticker Studio</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inspired by ol-ivier on CodePen</p>
              </div>
            </div>
            
            <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
              <p>
                Welcome to the <strong>Retro Sticker Studio</strong>! Customize your channel's cover sticker with high-fidelity, layered 3D sticker effects.
              </p>
              <div>
                <span className="font-bold text-black uppercase text-[10px] tracking-wider block mb-1">How to design:</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Use <strong>Sticker Text</strong> to type your channel name or tagline (supports multi-line).</li>
                  <li>Customize colors for text, thick stroke outline, sticker border, and page background.</li>
                  <li>Adjust typography and 3D depth using the sliders.</li>
                  <li>Toggle visibility of the side panel by clicking the floating eye button.</li>
                </ul>
              </div>
              <p>
                Click <strong>Apply Cover</strong> to save your customized sticker directly to your channel, or click <strong>Export as PNG</strong> to download a transparent, high-resolution vector-like PNG image!
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-black/5 flex justify-end">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md active:scale-95 cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
