import { useState, useEffect, useRef } from 'react';
import { Camera, Palette, Trash2, Plus, X, UploadCloud, Sparkles, RotateCw, MoveUp, MoveDown, Check } from 'lucide-react';

// CATALOG OF PRE-BUILT RETRO VECTOR STICKERS
const STICKERS_CATALOG = [
  {
    id: 'smiley',
    name: 'Retro Yellow Smiley',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="#FFE500" stroke="#000" strokeWidth="4" />
        <circle cx="35" cy="40" r="6" fill="#000" />
        <circle cx="65" cy="40" r="6" fill="#000" />
        <path d="M 30 65 Q 50 85 70 65" fill="none" stroke="#000" strokeWidth="5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'cool-smiley',
    name: 'Cool Pink Smiley',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="#FF2E93" stroke="#000" strokeWidth="4" />
        <path d="M 20 40 L 80 40 L 80 48 L 70 48 L 70 54 L 54 54 L 54 48 L 46 48 L 46 54 L 30 54 L 30 48 L 20 48 Z" fill="#000" stroke="#FFF" strokeWidth="1.5" />
        <path d="M 24 42 L 32 42 L 32 46 L 24 46 Z" fill="#FFF" opacity="0.7" />
        <path d="M 58 42 L 66 42 L 66 46 Z" fill="#FFF" opacity="0.7" />
        <path d="M 35 68 Q 50 82 65 68" fill="none" stroke="#000" strokeWidth="5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'cassette',
    name: '80s Cassette Tape',
    render: () => (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <rect x="5" y="5" width="110" height="70" rx="6" fill="#3A3F58" stroke="#000" strokeWidth="4" />
        <rect x="20" y="20" width="80" height="30" rx="3" fill="#00F0FF" stroke="#000" strokeWidth="3" />
        <circle cx="45" cy="35" r="10" fill="#FFE500" stroke="#000" strokeWidth="2.5" />
        <circle cx="75" cy="35" r="10" fill="#FFE500" stroke="#000" strokeWidth="2.5" />
        <line x1="45" y1="35" x2="75" y2="35" stroke="#000" strokeWidth="4" />
        <rect x="35" y="58" width="50" height="12" fill="#E2E8F0" stroke="#000" strokeWidth="2" />
      </svg>
    )
  },
  {
    id: 'star',
    name: 'Retro Star',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M 50 5 L 63 38 L 95 38 L 69 59 L 79 92 L 50 72 L 21 92 L 31 59 L 5 38 L 37 38 Z" fill="#FFE500" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="40" cy="45" r="3" fill="#000" />
        <circle cx="60" cy="45" r="3" fill="#000" />
        <path d="M 45 55 Q 50 60 55 55" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'lightning',
    name: 'Lightning Bolt',
    render: () => (
      <svg viewBox="0 0 60 100" className="w-full h-full">
        <path d="M 35 5 L 5 55 L 25 55 L 15 95 L 55 40 L 35 40 Z" fill="#FF00F0" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'rainbow',
    name: 'Retro Rainbow',
    render: () => (
      <svg viewBox="0 0 100 70" className="w-full h-full">
        <path d="M 10 65 A 40 40 0 0 1 90 65" fill="none" stroke="#FF0055" strokeWidth="8" strokeLinecap="round" />
        <path d="M 20 65 A 30 30 0 0 1 80 65" fill="none" stroke="#FFE500" strokeWidth="8" strokeLinecap="round" />
        <path d="M 30 65 A 20 20 0 0 1 70 65" fill="none" stroke="#00F0FF" strokeWidth="8" strokeLinecap="round" />
        <path d="M 40 65 A 10 10 0 0 1 60 65" fill="none" stroke="#A855F7" strokeWidth="8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'heart',
    name: 'Pixel Heart',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M 50 85 L 15 50 L 15 30 L 30 15 L 50 35 L 70 15 L 85 30 L 85 50 Z" fill="#FF0055" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
        <rect x="25" y="25" width="10" height="10" fill="#FFF" opacity="0.6" />
      </svg>
    )
  },
  {
    id: 'daisy',
    name: 'Retro Daisy',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <g stroke="#000" strokeWidth="3">
          <circle cx="50" cy="20" r="14" fill="#FFF" />
          <circle cx="50" cy="80" r="14" fill="#FFF" />
          <circle cx="20" cy="50" r="14" fill="#FFF" />
          <circle cx="80" cy="50" r="14" fill="#FFF" />
          <circle cx="29" cy="29" r="14" fill="#FFF" />
          <circle cx="71" cy="29" r="14" fill="#FFF" />
          <circle cx="29" cy="71" r="14" fill="#FFF" />
          <circle cx="71" cy="71" r="14" fill="#FFF" />
          <circle cx="50" cy="50" r="18" fill="#FFE500" />
        </g>
      </svg>
    )
  },
  {
    id: 'ufo',
    name: 'Retro UFO',
    render: () => (
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <path d="M 40 40 Q 60 15 80 40 Z" fill="#00F0FF" stroke="#000" strokeWidth="3" />
        <ellipse cx="60" cy="45" rx="50" ry="15" fill="#A855F7" stroke="#000" strokeWidth="3.5" />
        <circle cx="30" cy="45" r="4" fill="#FFE500" />
        <circle cx="45" cy="48" r="4" fill="#FFE500" />
        <circle cx="60" cy="49" r="4" fill="#FFE500" />
        <circle cx="75" cy="48" r="4" fill="#FFE500" />
        <circle cx="90" cy="45" r="4" fill="#FFE500" />
        <polygon points="45 57, 20 80, 100 80, 75 57" fill="#FFE500" opacity="0.3" stroke="#FFE500" strokeWidth="1" strokeDasharray="3,3" />
      </svg>
    )
  },
  {
    id: 'gameboy',
    name: 'Retro Handheld Console',
    render: () => (
      <svg viewBox="0 0 80 120" className="w-full h-full">
        <rect x="5" y="5" width="70" height="110" rx="8" fill="#D1D5DB" stroke="#000" strokeWidth="4" />
        <rect x="15" y="15" width="50" height="40" rx="3" fill="#8E9E78" stroke="#000" strokeWidth="3" />
        <rect x="22" y="22" width="36" height="26" fill="#7C8F60" />
        <path d="M 25 70 L 30 70 L 30 65 L 35 65 L 35 70 L 40 70 L 40 75 L 35 75 L 35 80 L 30 80 L 30 75 L 25 75 Z" fill="#374151" stroke="#000" strokeWidth="1.5" />
        <circle cx="55" cy="78" r="5" fill="#EF4444" stroke="#000" strokeWidth="1.5" />
        <circle cx="65" cy="72" r="5" fill="#EF4444" stroke="#000" strokeWidth="1.5" />
        <line x1="30" y1="102" x2="42" y2="102" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
        <line x1="48" y1="102" x2="60" y2="102" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'cherries',
    name: 'Vintage Cherries',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M 60 20 Q 40 15 30 45" fill="none" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
        <path d="M 60 20 Q 55 30 65 50" fill="none" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
        <path d="M 50 15 C 55 10, 68 12, 70 20 C 65 25, 55 20, 50 15 Z" fill="#22C55E" stroke="#000" strokeWidth="2" />
        <circle cx="30" cy="55" r="16" fill="#EF4444" stroke="#000" strokeWidth="3.5" />
        <circle cx="65" cy="60" r="16" fill="#EF4444" stroke="#000" strokeWidth="3.5" />
        <circle cx="24" cy="49" r="4" fill="#FFF" opacity="0.8" />
        <circle cx="59" cy="54" r="4" fill="#FFF" opacity="0.8" />
      </svg>
    )
  },
  {
    id: 'rad-speech',
    name: 'RAD! Speech Bubble',
    render: () => (
      <svg viewBox="0 0 120 70" className="w-full h-full">
        <path d="M 10 10 L 110 10 L 110 50 L 50 50 L 30 65 L 35 50 L 10 50 Z" fill="#FFF" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
        <text x="60" y="38" fontFamily="Impact, Arial Black, sans-serif" fontSize="24" fill="#FF00F0" textAnchor="middle" stroke="#000" strokeWidth="1" transform="rotate(-3, 60, 30)">RAD!</text>
      </svg>
    )
  },
  {
    id: 'cool-speech',
    name: 'COOL! Speech Bubble',
    render: () => (
      <svg viewBox="0 0 120 70" className="w-full h-full">
        <path d="M 10 10 L 110 10 L 110 50 L 70 50 L 80 65 L 60 50 L 10 50 Z" fill="#FFE500" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
        <text x="60" y="38" fontFamily="Impact, Arial Black, sans-serif" fontSize="22" fill="#000" textAnchor="middle" transform="rotate(2, 60, 30)">COOL!</text>
      </svg>
    )
  },
  {
    id: 'wow-speech',
    name: 'WOW! Speech Bubble',
    render: () => (
      <svg viewBox="0 0 120 70" className="w-full h-full">
        <path d="M 10 10 L 110 10 L 110 50 L 40 50 L 25 65 L 30 50 L 10 50 Z" fill="#00F0FF" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
        <text x="60" y="38" fontFamily="Impact, Arial Black, sans-serif" fontSize="24" fill="#FFF" stroke="#000" strokeWidth="1.5" textAnchor="middle" transform="rotate(-5, 60, 30)">WOW!</text>
      </svg>
    )
  },
  {
    id: 'sparkles',
    name: 'Cosmic Sparkles',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M 50 10 Q 50 50 90 50 Q 50 50 50 90 Q 50 50 10 50 Q 50 50 50 10 Z" fill="#00F0FF" stroke="#000" strokeWidth="3" />
        <path d="M 75 15 Q 75 30 90 30 Q 75 30 75 45 Q 75 30 60 30 Q 75 30 75 15 Z" fill="#FFE500" stroke="#000" strokeWidth="2" />
      </svg>
    )
  }
];

// CATALOG OF BACKGROUND PRESETS
const BACKGROUND_PRESETS = [
  {
    id: 'checkers-pink-yellow',
    name: 'Retro Checkboard',
    style: {
      backgroundImage: 'repeating-conic-gradient(#FF85FF 0% 25%, #FFE500 0% 50%)',
      backgroundSize: '36px 36px'
    }
  },
  {
    id: 'retro-grid',
    name: 'Synthwave Grid',
    style: {
      backgroundColor: '#110D2C',
      backgroundImage: `
        linear-gradient(to right, rgba(255, 46, 147, 0.25) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 46, 147, 0.25) 1px, transparent 1px)
      `,
      backgroundSize: '24px 24px'
    }
  },
  {
    id: 'retro-sunset',
    name: 'Vapor Sunset',
    style: {
      background: 'linear-gradient(135deg, #FF0055 0%, #FFE500 50%, #00F0FF 100%)'
    }
  },
  {
    id: 'blueprint-grid',
    name: 'Radical Grid',
    style: {
      backgroundColor: '#0066FF',
      backgroundImage: `
        linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px)
      `,
      backgroundSize: '20px 20px'
    }
  },
  {
    id: 'pastel-dreams',
    name: 'Pastel Aura',
    style: {
      background: 'linear-gradient(135deg, #A855F7 0%, #FFB6C1 50%, #98FF98 100%)'
    }
  },
  {
    id: 'neon-slime',
    name: 'Slime Acid',
    style: {
      background: 'radial-gradient(circle, #39FF14 0%, #111 80%)'
    }
  },
  {
    id: 'solid-pink',
    name: 'Hot Pink',
    style: { backgroundColor: '#FF0055' }
  },
  {
    id: 'solid-blue',
    name: 'Cyan Punk',
    style: { backgroundColor: '#00F0FF' }
  }
];

// DEFAULT BANNER COMPOSITION
const DEFAULT_STICKERS_COMPOSITION = [
  { id: 'default-txt', type: 'text', text: 'SIGNAL / NOISE LAB', x: 50, y: 50, scale: 1.6, rotate: -3, color: '#FFE500', font: 'Impact', fontStyle: 'retro-3d' },
  { id: 'default-smiley', type: 'sticker', value: 'smiley', x: 15, y: 48, scale: 1.2, rotate: 12 },
  { id: 'default-cassette', type: 'sticker', value: 'cassette', x: 84, y: 52, scale: 1.1, rotate: -15 },
  { id: 'default-star', type: 'sticker', value: 'star', x: 31, y: 24, scale: 0.9, rotate: 25 },
  { id: 'default-sparkles', type: 'sticker', value: 'sparkles', x: 67, y: 55, scale: 0.8, rotate: 0 }
];

export default function ChannelCover() {
  const [coverType, setCoverType] = useState('stickers'); // 'stickers' | 'upload'
  const [uploadedImage, setUploadedImage] = useState('');
  const [bgPresetId, setBgPresetId] = useState('retro-sunset');
  const [stickers, setStickers] = useState(DEFAULT_STICKERS_COMPOSITION);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('stickers'); // 'stickers' | 'upload'

  // Temporary Editor State inside modal
  const [editBgPresetId, setEditBgPresetId] = useState('retro-sunset');
  const [editStickers, setEditStickers] = useState([]);
  const [editUploadedImage, setEditUploadedImage] = useState('');
  const [activeStickerId, setActiveStickerId] = useState(null);

  // Text generator state
  const [textVal, setTextVal] = useState('');
  const [textFont, setTextFont] = useState('Impact');
  const [textColor, setTextColor] = useState('#FFE500');

  // Dragging states
  const [draggingStickerId, setDraggingStickerId] = useState(null);
  const canvasRef = useRef(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedType = localStorage.getItem('channel_cover_type');
    const savedImg = localStorage.getItem('channel_cover_image');
    const savedPreset = localStorage.getItem('channel_cover_preset');
    const savedStickersStr = localStorage.getItem('channel_cover_stickers');

    if (savedType) setCoverType(savedType);
    if (savedImg) setUploadedImage(savedImg);
    if (savedPreset) setBgPresetId(savedPreset);
    if (savedStickersStr) {
      try {
        setStickers(JSON.parse(savedStickersStr));
      } catch (e) {
        setStickers(DEFAULT_STICKERS_COMPOSITION);
      }
    }
  }, []);

  // Open Designer Modal with current states
  const openDesigner = () => {
    setEditBgPresetId(bgPresetId);
    setEditStickers(JSON.parse(JSON.stringify(stickers)));
    setEditUploadedImage(uploadedImage);
    setActiveTab(coverType);
    setIsModalOpen(true);
    setActiveStickerId(null);
    setTextVal('');
  };

  // Close Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setDraggingStickerId(null);
  };

  // Apply Changes to Live Channel page
  const saveChanges = () => {
    setCoverType(activeTab);
    setBgPresetId(editBgPresetId);
    setStickers(editStickers);
    setUploadedImage(editUploadedImage);

    localStorage.setItem('channel_cover_type', activeTab);
    localStorage.setItem('channel_cover_preset', editBgPresetId);
    localStorage.setItem('channel_cover_stickers', JSON.stringify(editStickers));
    localStorage.setItem('channel_cover_image', editUploadedImage);

    closeModal();
  };

  // Handle Custom Cover File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditUploadedImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add a Sticker to Studio Canvas
  const addStickerToCanvas = (stickerId) => {
    const newSticker = {
      id: `sticker-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'sticker',
      value: stickerId,
      x: 50, // center percentages
      y: 50,
      scale: 1.0,
      rotate: 0
    };
    setEditStickers([...editStickers, newSticker]);
    setActiveStickerId(newSticker.id);
  };

  // Add text sticker to Studio Canvas
  const addTextSticker = () => {
    if (!textVal.trim()) return;
    const newText = {
      id: `text-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'text',
      text: textVal.trim().toUpperCase(),
      x: 50,
      y: 50,
      scale: 1.2,
      rotate: 0,
      color: textColor,
      font: textFont,
      fontStyle: 'retro-3d'
    };
    setEditStickers([...editStickers, newText]);
    setActiveStickerId(newText.id);
    setTextVal('');
  };

  // Drag handlers for interactive canvas in studio
  const handleStickerStartDrag = (e, id) => {
    e.stopPropagation();
    setDraggingStickerId(id);
    setActiveStickerId(id);
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggingStickerId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

    if (clientX === undefined || clientY === undefined) return;

    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    // Constrain percentages to stay mostly on canvas
    x = Math.max(-10, Math.min(110, x));
    y = Math.max(-10, Math.min(110, y));

    setEditStickers(prev =>
      prev.map(s => (s.id === draggingStickerId ? { ...s, x, y } : s))
    );
  };

  const stopDragging = () => {
    setDraggingStickerId(null);
  };

  // Delete active or specific sticker
  const deleteSticker = (id) => {
    setEditStickers(editStickers.filter(s => s.id !== id));
    if (activeStickerId === id) {
      setActiveStickerId(null);
    }
  };

  // Update properties of the currently active sticker (scale, rotate, zIndex)
  const updateActiveSticker = (key, value) => {
    if (!activeStickerId) return;
    setEditStickers(prev =>
      prev.map(s => (s.id === activeStickerId ? { ...s, [key]: value } : s))
    );
  };

  // Adjust layer order (move up / down)
  const changeStickerLayer = (direction) => {
    if (!activeStickerId) return;
    const index = editStickers.findIndex(s => s.id === activeStickerId);
    if (index === -1) return;

    const newStickers = [...editStickers];
    if (direction === 'up' && index < newStickers.length - 1) {
      // Swap with next
      const temp = newStickers[index];
      newStickers[index] = newStickers[index + 1];
      newStickers[index + 1] = temp;
      setEditStickers(newStickers);
    } else if (direction === 'down' && index > 0) {
      // Swap with previous
      const temp = newStickers[index];
      newStickers[index] = newStickers[index - 1];
      newStickers[index - 1] = temp;
      setEditStickers(newStickers);
    }
  };

  const activeSticker = editStickers.find(s => s.id === activeStickerId);
  const currentPreset = BACKGROUND_PRESETS.find(p => p.id === bgPresetId) || BACKGROUND_PRESETS[2];
  const editCurrentPreset = BACKGROUND_PRESETS.find(p => p.id === editBgPresetId) || BACKGROUND_PRESETS[2];

  // Fonts available for text generator
  const FONTS_LIST = [
    { value: 'Impact', label: 'Retro Bubble' },
    { value: '"Space Grotesk", sans-serif', label: 'Grotesk Display' },
    { value: '"Courier New", monospace', label: 'Vintage Tech' },
    { value: '"Comic Sans MS", cursive', label: 'Naughty Comic' }
  ];

  return (
    <div id="channel-banner-root" className="w-full relative mb-6 group">
      {/* 1. CHANNEL LIVE BANNER HEADER */}
      <div
        style={coverType === 'stickers' ? currentPreset.style : {}}
        className="w-full h-44 sm:h-56 md:h-64 rounded-xl border border-white/10 overflow-hidden relative shadow-lg"
      >
        {coverType === 'upload' ? (
          uploadedImage ? (
            <img
              src={uploadedImage}
              alt="Channel Cover Banner"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            // Fallback inside live banner if upload is selected but empty
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 gap-2">
              <Camera size={36} className="text-slate-500 animate-pulse" />
              <p className="text-sm">No custom cover image uploaded yet.</p>
              <button
                onClick={openDesigner}
                className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
              >
                Upload Now
              </button>
            </div>
          )
        ) : (
          // View-only Vector Render of the Sticker Studio Banner (Fully responsive)
          <div className="w-full h-full relative overflow-hidden select-none">
            {/* Background pattern overlays */}
            {bgPresetId.includes('grid') && (
              <div className="absolute inset-0 opacity-20 pointer-events-none" />
            )}
            
            {/* Render each sticker based on its percentage positioning */}
            {stickers.map((s) => {
              if (s.type === 'text') {
                return (
                  <div
                    key={s.id}
                    style={{
                      left: `${s.x}%`,
                      top: `${s.y}%`,
                      transform: `translate(-50%, -50%) scale(${s.scale}) rotate(${s.rotate}deg)`,
                      fontFamily: s.font,
                      color: s.color,
                      fontSize: '22px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      textShadow: `
                        3px 3px 0px #000, 
                        -1px -1px 0px #000, 
                        1px -1px 0px #000, 
                        -1px 1px 0px #000, 
                        1px 1px 0px #000
                      `,
                      filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.75))'
                    }}
                    className="absolute pointer-events-none"
                  >
                    {s.text}
                  </div>
                );
              } else {
                const catalogItem = STICKERS_CATALOG.find(c => c.id === s.value);
                if (!catalogItem) return null;
                return (
                  <div
                    key={s.id}
                    style={{
                      left: `${s.x}%`,
                      top: `${s.y}%`,
                      transform: `translate(-50%, -50%) scale(${s.scale}) rotate(${s.rotate}deg)`,
                      width: '72px',
                      height: '72px',
                      filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.75))'
                    }}
                    className="absolute pointer-events-none"
                  >
                    {catalogItem.render()}
                  </div>
                );
              }
            })}
          </div>
        )}

        {/* Edit Button Floating Over Banner */}
        <button
          onClick={openDesigner}
          className="absolute right-4 bottom-4 bg-black/80 hover:bg-black/100 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-1.5 transition duration-150 shadow-md backdrop-blur-sm group-hover:scale-105"
        >
          <Palette size={14} className="text-pink-400" />
          <span>Customize Cover</span>
        </button>
      </div>

      {/* 2. DESIGNER WORKSHOP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 sm:p-4 z-[999] overflow-y-auto backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1C1C24] w-full max-w-5xl rounded-2xl border border-white/10 flex flex-col overflow-hidden max-h-[96vh] sm:max-h-[92vh] shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#15151A]">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-pink-500" />
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Channel Cover Design Studio</h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Studio Navigation Tabs (Retro / Upload) */}
            <div className="flex bg-[#121216] border-b border-white/10">
              <button
                onClick={() => setActiveTab('stickers')}
                className={`flex-1 py-3 text-center text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
                  activeTab === 'stickers'
                    ? 'border-pink-500 text-pink-500 bg-pink-500/5'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Palette size={16} />
                <span>Option 1: Retro Sticker Studio</span>
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-3 text-center text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
                  activeTab === 'upload'
                    ? 'border-pink-500 text-pink-500 bg-pink-500/5'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <UploadCloud size={16} />
                <span>Option 2: Upload Own Photo</span>
              </button>
            </div>

            {/* Modal Content - Scrollable Workspace */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              
              {/* LIVE WORKSPACE CANVAS PANEL */}
              <div className="bg-slate-950 p-2 rounded-xl border border-white/5 shadow-inner">
                <div className="text-xs text-slate-500 mb-2 font-mono flex justify-between">
                  <span>LIVE WORKSPACE CANVAS</span>
                  {activeTab === 'stickers' && (
                    <span className="text-pink-400 animate-pulse">● Click, drag, and style stickers directly!</span>
                  )}
                </div>

                <div
                  ref={canvasRef}
                  style={activeTab === 'stickers' ? editCurrentPreset.style : {}}
                  onMouseMove={handleCanvasMouseMove}
                  onTouchMove={handleCanvasMouseMove}
                  onMouseUp={stopDragging}
                  onTouchEnd={stopDragging}
                  onMouseLeave={stopDragging}
                  className="w-full h-36 sm:h-48 md:h-56 rounded-lg overflow-hidden relative shadow-lg select-none"
                >
                  {activeTab === 'upload' ? (
                    editUploadedImage ? (
                      <img
                        src={editUploadedImage}
                        alt="Custom cover preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-900 border-2 border-dashed border-white/10 rounded-lg">
                        <Camera size={32} />
                        <p className="text-sm">Please select a file below to preview.</p>
                      </div>
                    )
                  ) : (
                    // Interactively Drag & Drop Sticker Studio Workspace
                    <div className="w-full h-full absolute inset-0">
                      {editStickers.map((s) => {
                        const isSelected = s.id === activeStickerId;
                        
                        if (s.type === 'text') {
                          return (
                            <div
                              key={s.id}
                              onMouseDown={(e) => handleStickerStartDrag(e, s.id)}
                              onTouchStart={(e) => handleStickerStartDrag(e, s.id)}
                              style={{
                                left: `${s.x}%`,
                                top: `${s.y}%`,
                                transform: `translate(-50%, -50%) scale(${s.scale}) rotate(${s.rotate}deg)`,
                                fontFamily: s.font,
                                color: s.color,
                                fontSize: '20px',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                textShadow: `
                                  3px 3px 0px #000, 
                                  -1px -1px 0px #000, 
                                  1px -1px 0px #000, 
                                  -1px 1px 0px #000, 
                                  1px 1px 0px #000
                                `,
                                filter: 'drop-shadow(3px 3px 0px rgba(0,0,0,0.75))',
                                cursor: 'move',
                                zIndex: editStickers.indexOf(s) + 10
                              }}
                              className={`absolute select-none p-1.5 rounded ${
                                isSelected ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-slate-950 bg-white/5' : ''
                              }`}
                            >
                              {s.text}
                              {isSelected && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSticker(s.id);
                                  }}
                                  className="absolute -top-3.5 -right-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 border border-black/80 shadow-md"
                                >
                                  <X size={10} />
                                </button>
                              )}
                            </div>
                          );
                        } else {
                          const catalogItem = STICKERS_CATALOG.find(c => c.id === s.value);
                          if (!catalogItem) return null;
                          return (
                            <div
                              key={s.id}
                              onMouseDown={(e) => handleStickerStartDrag(e, s.id)}
                              onTouchStart={(e) => handleStickerStartDrag(e, s.id)}
                              style={{
                                left: `${s.x}%`,
                                top: `${s.y}%`,
                                transform: `translate(-50%, -50%) scale(${s.scale}) rotate(${s.rotate}deg)`,
                                width: '64px',
                                height: '64px',
                                filter: 'drop-shadow(3px 3px 0px rgba(0,0,0,0.75))',
                                cursor: 'move',
                                zIndex: editStickers.indexOf(s) + 10
                              }}
                              className={`absolute select-none p-1 rounded-full ${
                                isSelected ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-slate-950 bg-white/5' : ''
                              }`}
                            >
                              {catalogItem.render()}
                              {isSelected && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSticker(s.id);
                                  }}
                                  className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 border border-black/80 shadow-md"
                                >
                                  <X size={10} />
                                </button>
                              )}
                            </div>
                          );
                        }
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* BENTO TOOLBOX COLUMNS */}
              {activeTab === 'upload' ? (
                /* OPTION 1: UPLOAD OWN PHOTO */
                <div className="bg-[#24242F] p-5 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-4 text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                    <UploadCloud size={32} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Select cover image from computer</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md">
                      Best quality: 1200x300px or any widescreen landscape orientation. We will save your image securely in local storage.
                    </p>
                  </div>
                  <label className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl cursor-pointer shadow-md transition duration-150 flex items-center gap-2">
                    <Plus size={16} />
                    <span>Choose Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {editUploadedImage && (
                    <div className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
                      <Check size={14} />
                      <span>Image loaded successfully! Preview it above.</span>
                    </div>
                  )}
                </div>
              ) : (
                /* OPTION 2: RETRO STICKER STUDIO DRAWERS */
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* Left Column: Background & Stickers Selectors */}
                  <div className="md:col-span-8 flex flex-col gap-4">
                    
                    {/* A. Background Presets Drawer */}
                    <div className="bg-[#24242F] p-4 rounded-xl border border-white/5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Palette size={14} className="text-emerald-400" />
                        <span>Choose Studio Background</span>
                      </h4>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {BACKGROUND_PRESETS.map((bg) => (
                          <button
                            key={bg.id}
                            onClick={() => setEditBgPresetId(bg.id)}
                            style={bg.style}
                            title={bg.name}
                            className={`h-10 rounded-lg relative overflow-hidden transition-all duration-150 transform hover:scale-105 border-2 ${
                              editBgPresetId === bg.id
                                ? 'border-white scale-105 shadow-md shadow-black/50'
                                : 'border-black/30 hover:border-white/50'
                            }`}
                          >
                            {editBgPresetId === bg.id && (
                              <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                <Check size={14} className="text-white drop-shadow" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* B. Stickers Drawer */}
                    <div className="bg-[#24242F] p-4 rounded-xl border border-white/5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-pink-400" />
                        <span>Spawning Stickers Catalog</span>
                      </h4>
                      <div className="grid grid-cols-5 sm:grid-cols-7 gap-3">
                        {STICKERS_CATALOG.map((st) => (
                          <button
                            key={st.id}
                            onClick={() => addStickerToCanvas(st.id)}
                            title={st.name}
                            className="bg-slate-900/60 hover:bg-slate-800 border border-white/5 hover:border-pink-500/30 p-2 rounded-lg flex items-center justify-center transition-all duration-150 transform hover:scale-110 aspect-square group shadow-sm"
                          >
                            <div className="w-10 h-10 group-hover:rotate-6 transition">
                              {st.render()}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* C. Text Sticker Generator */}
                    <div className="bg-[#24242F] p-4 rounded-xl border border-white/5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Plus size={14} className="text-blue-400" />
                        <span>Add Retro Text Badge</span>
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={textVal}
                          onChange={(e) => setTextVal(e.target.value)}
                          maxLength={32}
                          placeholder="TYPE RETRO PHRASE..."
                          className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white font-semibold text-sm focus:outline-none focus:border-pink-500 uppercase tracking-wide"
                        />
                        <div className="flex gap-2">
                          {/* Font Selector */}
                          <select
                            value={textFont}
                            onChange={(e) => setTextFont(e.target.value)}
                            className="bg-slate-900 text-slate-300 border border-white/10 rounded-lg px-2 py-2 text-xs font-semibold focus:outline-none focus:border-pink-500"
                          >
                            {FONTS_LIST.map(f => (
                              <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                          </select>
                          {/* Retro Color Quick Picker */}
                          <div className="flex gap-1 items-center bg-slate-900 border border-white/10 rounded-lg px-1.5">
                            {['#FFE500', '#FF00F0', '#00F0FF', '#39FF14', '#FFF'].map((c) => (
                              <button
                                key={c}
                                onClick={() => setTextColor(c)}
                                style={{ backgroundColor: c }}
                                className={`w-5 h-5 rounded-full border border-black/50 ${
                                  textColor === c ? 'ring-2 ring-white scale-110' : ''
                                }`}
                              />
                            ))}
                          </div>
                          {/* Spawner Button */}
                          <button
                            onClick={addTextSticker}
                            className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1 shadow transition active:scale-95"
                          >
                            <Plus size={12} />
                            <span>Spawn</span>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Selected Sticker Properties Controller */}
                  <div className="md:col-span-4 flex flex-col gap-4">
                    <div className="bg-[#24242F] p-4 rounded-xl border border-white/5 flex-1 flex flex-col">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <RotateCw size={14} className="text-yellow-400" />
                        <span>Active Sticker Controls</span>
                      </h4>

                      {activeSticker ? (
                        <div className="flex-1 flex flex-col gap-5 justify-center">
                          {/* Active Sticker Summary */}
                          <div className="bg-slate-950/40 p-3 rounded-lg border border-white/5 flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-900 border border-white/10 rounded-lg flex items-center justify-center p-1.5">
                              {activeSticker.type === 'text' ? (
                                <span className="font-bold text-xs text-white">TXT</span>
                              ) : (
                                STICKERS_CATALOG.find(c => c.id === activeSticker.value)?.render()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-400 uppercase font-mono">SELECTED TYPE</p>
                              <p className="text-sm font-bold text-white truncate">
                                {activeSticker.type === 'text' ? `Text: ${activeSticker.text}` : STICKERS_CATALOG.find(c => c.id === activeSticker.value)?.name}
                              </p>
                            </div>
                          </div>

                          {/* Scale Slider */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-slate-300">
                              <span>Sticker Scale</span>
                              <span className="font-mono text-pink-400">{activeSticker.scale.toFixed(1)}x</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="3.0"
                              step="0.1"
                              value={activeSticker.scale}
                              onChange={(e) => updateActiveSticker('scale', parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                          </div>

                          {/* Rotation Slider */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-slate-300">
                              <span>Rotation Angle</span>
                              <span className="font-mono text-emerald-400">{activeSticker.rotate}°</span>
                            </div>
                            <input
                              type="range"
                              min="-180"
                              max="180"
                              step="5"
                              value={activeSticker.rotate}
                              onChange={(e) => updateActiveSticker('rotate', parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                          </div>

                          {/* Layer arrangements */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300 block">Z-Layer Ordering</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => changeStickerLayer('up')}
                                className="bg-[#1C1C24] hover:bg-[#2F2F3D] border border-white/5 hover:border-white/10 text-white rounded-lg py-2 px-3 text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                              >
                                <MoveUp size={12} className="text-blue-400" />
                                <span>Bring to Front</span>
                              </button>
                              <button
                                onClick={() => changeStickerLayer('down')}
                                className="bg-[#1C1C24] hover:bg-[#2F2F3D] border border-white/5 hover:border-white/10 text-white rounded-lg py-2 px-3 text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                              >
                                <MoveDown size={12} className="text-orange-400" />
                                <span>Send to Back</span>
                              </button>
                            </div>
                          </div>

                          {/* Delete Sticker Button */}
                          <button
                            onClick={() => deleteSticker(activeStickerId)}
                            className="bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white rounded-lg py-2.5 px-3 text-xs flex items-center justify-center gap-1.5 transition duration-150 mt-2 font-semibold"
                          >
                            <Trash2 size={13} />
                            <span>Delete Selected Sticker</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center text-slate-500 border border-dashed border-white/5 rounded-lg bg-slate-950/20 p-4 py-8">
                          <Palette size={24} className="opacity-50 animate-bounce" />
                          <p className="text-xs font-medium max-w-[180px]">
                            Click any sticker on the live preview canvas above to activate designer controls!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-white/10 bg-[#15151A] flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400 max-w-[280px] hidden sm:block">
                All changes will be applied instantly to your channel's public banner cover.
              </p>
              <div className="flex gap-3 justify-end w-full sm:w-auto">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition"
                >
                  Discard Changes
                </button>
                <button
                  onClick={saveChanges}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Apply Banner to Channel</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
