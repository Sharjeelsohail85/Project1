import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { 
  Settings, 
  X, 
  HelpCircle, 
  Download, 
  Check, 
  Sliders, 
  Palette,
  Undo
} from 'lucide-react';
import { 
  HSB, 
  hsbToHex, 
  hexToHsb 
} from './utils/color';

export default function App() {
  // Core text state
  const [text, setText] = useState<string>("GOOD<br>MORNING!");

  // Layout parameters
  const [textSize, setTextSize] = useState<number>(8.5); // rem
  const [lineHeight, setLineHeight] = useState<number>(0.95);
  const [stickerThickness, setStickerThickness] = useState<number>(54); // px
  const [rotation, setRotation] = useState<number>(-6); // deg
  const [skew, setSkew] = useState<number>(-4); // deg

  // Color parameters
  const [textColor, setTextColor] = useState<string>('#f1593c');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [stickerColor, setStickerColor] = useState<string>('#f2b714');
  const [shadowColor, setShadowColor] = useState<string>('#000000');
  const [shadowTransparent, setShadowTransparent] = useState<boolean>(false);
  const [bodyBgColor, setBodyBgColor] = useState<string>('#c97118');

  // Interactive UI panel states
  const [panelOpen, setPanelOpen] = useState<boolean>(true);
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  // Color picker states
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const [pickerColor, setPickerColor] = useState<HSB>({ h: 8, s: 85, b: 95 });

  // Handle color target selection
  const handleColorTriggerClick = (target: string, currentHex: string) => {
    if (pickerTarget === target) {
      setPickerTarget(null);
    } else {
      setPickerTarget(target);
      setPickerColor(hexToHsb(currentHex));
    }
  };

  // Sync color selection back to correct target
  const updateTargetColor = (hsb: HSB) => {
    const hex = hsbToHex(hsb);
    if (pickerTarget === 'colorText') setTextColor(hex);
    else if (pickerTarget === 'colorStroke') setStrokeColor(hex);
    else if (pickerTarget === 'colorSticker') setStickerColor(hex);
    else if (pickerTarget === 'colorShadow') setShadowColor(hex);
    else if (pickerTarget === 'colorBodyBg') setBodyBgColor(hex);
  };

  // Handle saturation/brightness drag on color square
  const handleSquareMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const updateFromPosition = (clientX: number, clientY: number) => {
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
      const s = Math.round((x / rect.width) * 100);
      const b = 100 - Math.round((y / rect.height) * 100);
      setPickerColor(prev => {
        const next = { ...prev, s, b };
        updateTargetColor(next);
        return next;
      });
    };

    updateFromPosition(e.clientX, e.clientY);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateFromPosition(moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Handle hue drag on vertical hue bar
  const handleHueMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const updateFromPosition = (clientY: number) => {
      const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
      const h = Math.round((1 - y / rect.height) * 360);
      setPickerColor(prev => {
        const next = { ...prev, h };
        updateTargetColor(next);
        return next;
      });
    };

    updateFromPosition(e.clientY);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateFromPosition(moveEvent.clientY);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Reset to default presets
  const handleReset = () => {
    setText("GOOD<br>MORNING!");
    setTextSize(8.5);
    setLineHeight(0.95);
    setStickerThickness(54);
    setRotation(-6);
    setSkew(-4);
    setTextColor('#f1593c');
    setStrokeColor('#000000');
    setStickerColor('#f2b714');
    setShadowColor('#000000');
    setShadowTransparent(false);
    setBodyBgColor('#c97118');
    setPickerTarget(null);
  };

  // Export Sticker as high-quality PNG
  const handleExport = async () => {
    setExporting(true);
    // Tiny delay to show the loading spinner gracefully
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const logoWrapper = document.querySelector('.logo-wrapper') as HTMLDivElement;
      if (!logoWrapper) return;

      // Create a temporary, off-screen container for high-fidelity clone rendering
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'fixed';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '-9999px';
      exportContainer.style.backgroundColor = 'transparent';
      exportContainer.style.display = 'inline-block';
      exportContainer.style.padding = '80px'; // Generous padding to prevent clipping of shadows
      document.body.appendChild(exportContainer);

      // Clone the actual workspace logo node
      const clone = logoWrapper.cloneNode(true) as HTMLDivElement;
      
      // Inject all reactive styles as static custom variables inside the clone
      clone.style.setProperty('--color-text', textColor);
      clone.style.setProperty('--color-stroke', strokeColor);
      clone.style.setProperty('--color-sticker', stickerColor);
      clone.style.setProperty('--color-shadow', shadowColor);
      clone.style.setProperty('--text-size', `${textSize}rem`);
      clone.style.setProperty('--line-height', lineHeight.toString());
      clone.style.setProperty('--sticker-size', `${stickerThickness}px`);
      clone.style.setProperty('--logo-rotation', '0deg'); // export completely flat & crisp
      clone.style.setProperty('--logo-skew', '0deg');

      clone.style.transform = 'none';
      clone.style.position = 'relative';
      clone.style.display = 'inline-block';
      
      exportContainer.appendChild(clone);

      // Wait for layout updates
      await new Promise(resolve => requestAnimationFrame(resolve));

      const canvas = await html2canvas(exportContainer, {
        scale: 4, // 4X UHD density
        useCORS: true,
        allowTaint: true,
        backgroundColor: null, // transparent png
        logging: false,
        width: exportContainer.scrollWidth,
        height: exportContainer.scrollHeight,
        onclone: (documentClone) => {
          const clonedLogo = documentClone.querySelector('.logo-wrapper') as HTMLDivElement;
          if (clonedLogo) {
            clonedLogo.style.transform = 'none';
          }
        }
      });

      document.body.removeChild(exportContainer);

      // Initiate download
      const link = document.createElement('a');
      link.download = `retro-sticker-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export error:', error);
      alert('An error occurred during export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Close picker on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const pickerEl = document.getElementById('colorPicker');
      const targetTrigger = document.querySelector(`[data-active="true"]`);
      if (pickerEl && !pickerEl.contains(e.target as Node) && targetTrigger && !targetTrigger.contains(e.target as Node)) {
        setPickerTarget(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [pickerTarget]);

  // Combined styles bound to CSS variables inside root workspace
  const workspaceStyles = {
    '--color-text': textColor,
    '--color-stroke': strokeColor,
    '--color-sticker': stickerColor,
    '--color-shadow': shadowColor,
    '--text-size': `${textSize}rem`,
    '--line-height': lineHeight,
    '--sticker-size': `${stickerThickness}px`,
    '--logo-rotation': `${rotation}deg`,
    '--logo-skew': `${skew}deg`,
  } as React.CSSProperties;

  const hueColor = hsbToHex({ h: pickerColor.h, s: 100, b: 100 });

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center relative select-none transition-colors duration-150 ease-out py-16 px-4"
      style={{ backgroundColor: bodyBgColor }}
    >
      {/* Visual Workspace Canvas */}
      <div className="workspace max-w-full flex items-center justify-center p-8 overflow-hidden">
        <div className="logo-wrapper" style={workspaceStyles}>
          {/* Sticker outline base backing */}
          <div 
            className={`text-layer layer-bg select-none pointer-events-none transition-all duration-100 ${
              shadowTransparent ? 'shadow-transparent' : ''
            }`}
            dangerouslySetInnerHTML={{ __html: text }}
          />
          {/* Middle 3D depth extrusion layer */}
          <div 
            className="text-layer layer-3d select-none pointer-events-none"
            dangerouslySetInnerHTML={{ __html: text }}
          />
          {/* Active front layer that handles input */}
          <div
            id="js-front"
            className="text-layer layer-front cursor-text"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setText(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: "GOOD<br>MORNING!" }}
            spellCheck="false"
          />
        </div>
      </div>

      {/* Floating Toggle Controls Button */}
      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={() => setPanelOpen(!panelOpen)}
          className={`w-12 h-12 rounded-full bg-black/75 hover:bg-black/90 text-white flex items-center justify-center transition-all duration-300 shadow-xl border border-white/10 relative group ${
            panelOpen ? 'scale-110 rotate-90' : ''
          }`}
          title="Toggle Panel"
        >
          {panelOpen ? <X size={20} /> : <Settings size={20} />}
          <span className="absolute top-[54px] right-0 bg-black/80 text-white text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {panelOpen ? 'Hide Panel' : 'Customization'}
          </span>
        </button>
      </div>

      {/* Sliding Control Customization Panel */}
      <div 
        className={`fixed top-24 right-6 bottom-6 w-[320px] bg-white/90 backdrop-blur-xl border border-white/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] z-40 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col overflow-hidden ${
          panelOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-[360px] opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-black/5 flex justify-between items-center bg-white/40">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-gray-500" />
            <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              Customization
            </h3>
          </div>
          <button 
            onClick={() => setPanelOpen(false)}
            className="p-1 rounded-lg hover:bg-black/5 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sliders and color inputs - Scrollable container */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 control-panel">
          
          {/* TEXT COLOR */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Text Color
              </label>
              <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase">
                {textColor}
              </span>
            </div>
            <button 
              data-active={pickerTarget === 'colorText'}
              onClick={() => handleColorTriggerClick('colorText', textColor)}
              className={`w-full h-10 border rounded-xl px-3 bg-white/60 hover:bg-white/80 transition-all flex items-center gap-3 cursor-pointer ${
                pickerTarget === 'colorText' ? 'border-black ring-2 ring-black/5' : 'border-black/5'
              }`}
            >
              <div className="w-5 h-5 rounded-md border border-black/5 flex-shrink-0" style={{ backgroundColor: textColor }} />
              <span className="text-xs font-mono font-medium text-gray-700 flex-1 text-left">{textColor}</span>
              {pickerTarget === 'colorText' && <Check size={14} className="text-black" />}
            </button>
          </div>

          {/* STROKE & 3D COLOR */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Stroke &amp; 3D
              </label>
              <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase">
                {strokeColor}
              </span>
            </div>
            <button 
              data-active={pickerTarget === 'colorStroke'}
              onClick={() => handleColorTriggerClick('colorStroke', strokeColor)}
              className={`w-full h-10 border rounded-xl px-3 bg-white/60 hover:bg-white/80 transition-all flex items-center gap-3 cursor-pointer ${
                pickerTarget === 'colorStroke' ? 'border-black ring-2 ring-black/5' : 'border-black/5'
              }`}
            >
              <div className="w-5 h-5 rounded-md border border-black/5 flex-shrink-0" style={{ backgroundColor: strokeColor }} />
              <span className="text-xs font-mono font-medium text-gray-700 flex-1 text-left">{strokeColor}</span>
              {pickerTarget === 'colorStroke' && <Check size={14} className="text-black" />}
            </button>
          </div>

          {/* STICKER BACKGROUND COLOR */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Sticker Background
              </label>
              <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase">
                {stickerColor}
              </span>
            </div>
            <button 
              data-active={pickerTarget === 'colorSticker'}
              onClick={() => handleColorTriggerClick('colorSticker', stickerColor)}
              className={`w-full h-10 border rounded-xl px-3 bg-white/60 hover:bg-white/80 transition-all flex items-center gap-3 cursor-pointer ${
                pickerTarget === 'colorSticker' ? 'border-black ring-2 ring-black/5' : 'border-black/5'
              }`}
            >
              <div className="w-5 h-5 rounded-md border border-black/5 flex-shrink-0" style={{ backgroundColor: stickerColor }} />
              <span className="text-xs font-mono font-medium text-gray-700 flex-1 text-left">{stickerColor}</span>
              {pickerTarget === 'colorSticker' && <Check size={14} className="text-black" />}
            </button>
          </div>

          {/* DROP SHADOW COLOR */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Drop Shadow
              </label>
              <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase">
                {shadowColor}
              </span>
            </div>
            <button 
              data-active={pickerTarget === 'colorShadow'}
              onClick={() => handleColorTriggerClick('colorShadow', shadowColor)}
              className={`w-full h-10 border rounded-xl px-3 bg-white/60 hover:bg-white/80 transition-all flex items-center gap-3 cursor-pointer ${
                pickerTarget === 'colorShadow' ? 'border-black ring-2 ring-black/5' : 'border-black/5'
              }`}
            >
              <div className="w-5 h-5 rounded-md border border-black/5 flex-shrink-0" style={{ backgroundColor: shadowColor }} />
              <span className="text-xs font-mono font-medium text-gray-700 flex-1 text-left">{shadowColor}</span>
              {pickerTarget === 'colorShadow' && <Check size={14} className="text-black" />}
            </button>
            <div className="flex items-center gap-2 pt-1 px-1">
              <input 
                type="checkbox" 
                id="shadowTransparent"
                checked={shadowTransparent}
                onChange={(e) => setShadowTransparent(e.target.checked)}
                className="w-4.5 h-4.5 accent-black rounded cursor-pointer border-black/10"
              />
              <label htmlFor="shadowTransparent" className="text-[10px] font-bold uppercase text-gray-400 tracking-wider cursor-pointer select-none">
                Shadow Transparent
              </label>
            </div>
          </div>

          {/* PAGE BACKGROUND COLOR */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Page Background
              </label>
              <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase">
                {bodyBgColor}
              </span>
            </div>
            <button 
              data-active={pickerTarget === 'colorBodyBg'}
              onClick={() => handleColorTriggerClick('colorBodyBg', bodyBgColor)}
              className={`w-full h-10 border rounded-xl px-3 bg-white/60 hover:bg-white/80 transition-all flex items-center gap-3 cursor-pointer ${
                pickerTarget === 'colorBodyBg' ? 'border-black ring-2 ring-black/5' : 'border-black/5'
              }`}
            >
              <div className="w-5 h-5 rounded-md border border-black/5 flex-shrink-0" style={{ backgroundColor: bodyBgColor }} />
              <span className="text-xs font-mono font-medium text-gray-700 flex-1 text-left">{bodyBgColor}</span>
              {pickerTarget === 'colorBodyBg' && <Check size={14} className="text-black" />}
            </button>
          </div>

          <div className="border-t border-black/5 my-4" />

          {/* SLIDERS SECTION */}
          {/* TEXT SIZE */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Text Size
              </label>
              <span className="text-xs font-mono font-bold text-gray-600">{textSize}rem</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="14" 
              step="0.2" 
              value={textSize}
              onChange={(e) => setTextSize(parseFloat(e.target.value))}
              className="w-full accent-black cursor-pointer h-1.5 bg-black/10 rounded-lg appearance-none"
            />
          </div>

          {/* LINE HEIGHT */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Line Height
              </label>
              <span className="text-xs font-mono font-bold text-gray-600">{lineHeight}</span>
            </div>
            <input 
              type="range" 
              min="0.6" 
              max="1.5" 
              step="0.02" 
              value={lineHeight}
              onChange={(e) => setLineHeight(parseFloat(e.target.value))}
              className="w-full accent-black cursor-pointer h-1.5 bg-black/10 rounded-lg appearance-none"
            />
          </div>

          {/* STICKER THICKNESS */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Sticker Thickness
              </label>
              <span className="text-xs font-mono font-bold text-gray-600">{stickerThickness}px</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="100" 
              step="1" 
              value={stickerThickness}
              onChange={(e) => setStickerThickness(parseInt(e.target.value))}
              className="w-full accent-black cursor-pointer h-1.5 bg-black/10 rounded-lg appearance-none"
            />
          </div>

          <div className="border-t border-black/5 my-4" />

          {/* ROTATION */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Rotation
              </label>
              <span className="text-xs font-mono font-bold text-gray-600">{rotation}°</span>
            </div>
            <input 
              type="range" 
              min="-30" 
              max="30" 
              step="0.5" 
              value={rotation}
              onChange={(e) => setRotation(parseFloat(e.target.value))}
              className="w-full accent-black cursor-pointer h-1.5 bg-black/10 rounded-lg appearance-none"
            />
          </div>

          {/* SKEW */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Skew
              </label>
              <span className="text-xs font-mono font-bold text-gray-600">{skew}°</span>
            </div>
            <input 
              type="range" 
              min="-20" 
              max="20" 
              step="0.5" 
              value={skew}
              onChange={(e) => setSkew(parseFloat(e.target.value))}
              className="w-full accent-black cursor-pointer h-1.5 bg-black/10 rounded-lg appearance-none"
            />
          </div>

        </div>

        {/* Export and Reset Buttons - Fixed Footer */}
        <div className="px-6 py-5 border-t border-black/5 bg-white/40 flex flex-col gap-2.5">
          <button 
            onClick={handleExport}
            disabled={exporting}
            className={`w-full py-3.5 border-none rounded-xl bg-[#1a1a1a] hover:bg-[#333] text-white text-[11px] font-bold uppercase tracking-wider transition-all duration-250 cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75 disabled:pointer-events-none`}
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Export as PNG</span>
              </>
            )}
          </button>
          <button 
            onClick={handleReset}
            className="w-full py-3 border border-black/10 hover:border-black/25 text-gray-600 hover:text-gray-900 rounded-xl bg-transparent text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Undo size={12} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* FLOATING COLOR PICKER CARD */}
      {pickerTarget && (
        <div 
          id="colorPicker"
          className="fixed bg-white/95 backdrop-blur-2xl border border-white/50 rounded-2xl p-4.5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] z-50 flex gap-4 transition-all duration-300 animate-fadeIn"
          style={{
            // Position near the slider drawer panel to avoid overlapping and keeping clean screen bounds
            top: '100px',
            right: '360px',
          }}
        >
          {/* Saturation-Brightness Canvas */}
          <div 
            className="w-[180px] h-[180px] rounded-lg overflow-hidden cursor-crosshair relative"
            style={{ backgroundColor: hueColor }}
            onMouseDown={handleSquareMouseDown}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent rounded-lg pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent rounded-lg pointer-events-none" />
            <div 
              className="absolute w-[14px] h-[14px] -ml-[7px] -mt-[7px] border-2 border-white rounded-full pointer-events-none z-10 shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_2px_8px_rgba(0,0,0,0.15)]"
              style={{ 
                left: `${pickerColor.s}%`, 
                top: `${100 - pickerColor.b}%` 
              }}
            >
              <div className="absolute w-2.5 h-2.5 border border-black/10 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Vertical Hue Slider */}
          <div 
            className="relative w-4.5 h-[180px] rounded-full cursor-ns-resize"
            style={{
              background: 'linear-gradient(to bottom, #ff0000 0%, #ff0080 8.33%, #ff00ff 16.67%, #8000ff 25%, #0000ff 33.33%, #0080ff 41.67%, #00ffff 50%, #00ff80 58.33%, #00ff00 66.67%, #80ff00 75%, #ffff00 83.33%, #ff8000 91.67%, #ff0000 100%)'
            }}
            onMouseDown={handleHueMouseDown}
          >
            <div 
              className="absolute w-full h-1.5 -mt-[3px] pointer-events-none left-0 z-10"
              style={{ top: `${((360 - pickerColor.h) / 360) * 100}%` }}
            >
              <div className="hue-arrow-left" />
              <div className="hue-arrow-right" />
            </div>
          </div>
        </div>
      )}

      {/* Floating "?" Help Information Trigger Button */}
      <div className="fixed bottom-6 left-6 z-30">
        <button 
          onClick={() => setHelpOpen(true)}
          className="w-12 h-12 rounded-full bg-white border-4 border-black text-black flex items-center justify-center font-bold text-lg hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer shadow-lg"
          title="Open Help"
        >
          ?
        </button>
      </div>

      {/* Elegant Help Modal overlay */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] max-w-md w-full overflow-hidden border border-white/10 animate-scaleUp">
            <div className="p-6 relative text-center">
              <button 
                onClick={() => setHelpOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-black font-semibold cursor-pointer transition-colors"
              >
                ✕
              </button>
              <h2 className="text-xl font-extrabold text-black mt-2 mb-4 tracking-tight">
                Retro Sticker Studio
              </h2>
              <div className="text-left space-y-4 text-sm leading-relaxed text-gray-600 px-2 mb-6">
                <p>
                  <strong>✨ Editable Sticker Content:</strong> Click directly on the main 3D text in the center, highlight it, and type your custom message!
                </p>
                <p>
                  <strong>🎨 Customization Panel:</strong> Expand the sliding panel in the top-right corner to fine-tune text size, custom 3D colors, sticker backing, line heights, rotation, and shear slants.
                </p>
                <p>
                  <strong>💾 Transparent Export:</strong> Click <em>"Export as PNG"</em> to save a 4X Ultra-HD transparent PNG of your design, ready to use on posters, websites, or social templates!
                </p>
              </div>
              <div className="border-t border-black/5 pt-4 text-xs font-semibold text-gray-400">
                Retro Sticker Studio — TOC Inspiration
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
