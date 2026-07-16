import { useState, useEffect, useRef, memo } from 'react';
import { 
  Camera, Palette, Trash2, Plus, X, UploadCloud, Sparkles, 
  RotateCw, MoveUp, MoveDown, Check, Eye, EyeOff, Music, 
  Layers, RefreshCw, FileText, Settings, Heart 
} from 'lucide-react';

// --- SYNTHESIZED 8-BIT AUDIO EFFECTS ---
const playRetroSound = (type) => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    switch (type) {
      case 'peel': // 8-bit slide-up sweep for peeling
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.18);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      case 'stick': // Satisfying downward pop for placement
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      case 'spawn': // Chime sound for adding sticker
        osc.type = 'square';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.setValueAtTime(495, now + 0.05);
        osc.frequency.setValueAtTime(660, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      case 'delete': // Disintegrate/zap sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'template': // Upward synth fan-fare
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.setValueAtTime(329, now + 0.08);
        osc.frequency.setValueAtTime(392, now + 0.16);
        osc.frequency.setValueAtTime(523, now + 0.24);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
    }
  } catch (e) {
    console.warn('Audio play failed or blocked by browser gesture lock.');
  }
};

// --- PRE-BUILT HIGH FIDELITY RETRO STICKERS ---
const STICKERS_CATALOG = [
  {
    id: 'smiley',
    name: 'Retro Acid Smiley',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full select-none">
        <circle cx="50" cy="50" r="45" fill="#FFE500" stroke="#000" strokeWidth="4.5" />
        <circle cx="35" cy="40" r="6" fill="#000" />
        <circle cx="65" cy="40" r="6" fill="#000" />
        <path d="M 28 62 Q 50 85 72 62" fill="none" stroke="#000" strokeWidth="5.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'cool-smiley',
    name: 'Shades Pink Smiley',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full select-none">
        <circle cx="50" cy="50" r="45" fill="#FF2E93" stroke="#000" strokeWidth="4.5" />
        {/* Cool 8bit shades */}
        <path d="M 20 40 L 80 40 L 80 48 L 70 48 L 70 54 L 54 54 L 54 48 L 46 48 L 46 54 L 30 54 L 30 48 L 20 48 Z" fill="#000" stroke="#FFF" strokeWidth="1.5" />
        <path d="M 24 42 L 32 42 L 32 46 L 24 46 Z" fill="#FFF" opacity="0.6" />
        <path d="M 58 42 L 66 42 L 66 46 Z" fill="#FFF" opacity="0.6" />
        <path d="M 33 66 Q 50 82 67 66" fill="none" stroke="#000" strokeWidth="5.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'alien',
    name: 'Luminous Alien',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full select-none">
        <path d="M 50 5 C 15 5, 10 50, 20 70 C 30 85, 42 95, 50 95 C 58 95, 70 85, 80 70 C 90 50, 85 5, 50 5 Z" fill="#39FF14" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
        <ellipse cx="32" cy="52" rx="12" ry="18" fill="#000" transform="rotate(-15, 32, 52)" />
        <ellipse cx="68" cy="52" rx="12" ry="18" fill="#000" transform="rotate(15, 68, 52)" />
        <ellipse cx="30" cy="46" rx="3" ry="5" fill="#FFF" opacity="0.8" transform="rotate(-15, 30, 46)" />
        <ellipse cx="66" cy="46" rx="3" ry="5" fill="#FFF" opacity="0.8" transform="rotate(15, 66, 46)" />
        <path d="M 44 78 Q 50 82 56 78" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'yin-yang',
    name: '90s Yin-Yang',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full select-none">
        <circle cx="50" cy="50" r="45" fill="#A855F7" stroke="#000" strokeWidth="4.5" />
        <path d="M 50 5 A 22.5 22.5 0 0 1 50 50 A 22.5 22.5 0 0 0 50 95 A 45 45 0 0 1 50 5 Z" fill="#FFE500" stroke="#000" strokeWidth="1" />
        <circle cx="50" cy="27.5" r="7.5" fill="#A855F7" />
        <circle cx="50" cy="72.5" r="7.5" fill="#FFE500" />
        <circle cx="50" cy="50" r="45" fill="none" stroke="#000" strokeWidth="4.5" />
      </svg>
    )
  },
  {
    id: 'cassette',
    name: '80s Cassette Tape',
    render: () => (
      <svg viewBox="0 0 120 80" className="w-full h-full select-none">
        <rect x="5" y="5" width="110" height="70" rx="8" fill="#2E2E38" stroke="#000" strokeWidth="4.5" />
        <rect x="18" y="18" width="84" height="32" rx="4" fill="#00F0FF" stroke="#000" strokeWidth="3" />
        <circle cx="44" cy="34" r="10" fill="#FFE500" stroke="#000" strokeWidth="3" />
        <circle cx="76" cy="34" r="10" fill="#FFE500" stroke="#000" strokeWidth="3" />
        <line x1="44" y1="34" x2="76" y2="34" stroke="#000" strokeWidth="4" />
        <rect x="35" y="58" width="50" height="12" fill="#E2E8F0" stroke="#000" strokeWidth="2.5" />
      </svg>
    )
  },
  {
    id: 'floppy',
    name: '3.5" Cyber Disk',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full select-none">
        <path d="M 5 5 L 80 5 L 95 20 L 95 95 L 5 95 Z" fill="#3B82F6" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
        <rect x="20" y="5" width="48" height="28" fill="#FFF" stroke="#000" strokeWidth="3" rx="2" />
        <rect x="28" y="10" width="10" height="18" fill="#000" />
        <rect x="15" y="48" width="70" height="47" fill="#F8FAFC" stroke="#000" strokeWidth="3" rx="3" />
        <line x1="25" y1="60" x2="75" y2="60" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
        <line x1="25" y1="72" x2="75" y2="72" stroke="#475569" strokeWidth="3.5" />
        <line x1="25" y1="82" x2="60" y2="82" stroke="#475569" strokeWidth="3.5" />
      </svg>
    )
  },
  {
    id: 'palm-tree',
    name: 'Vapor Wave Tree',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full select-none">
        <circle cx="50" cy="50" r="45" fill="linear-gradient(to bottom, #FF007F, #FF7F00)" stroke="#000" strokeWidth="4.5" />
        {/* Grid lines inside circle */}
        <clipPath id="circle-clip">
          <circle cx="50" cy="50" r="43" />
        </clipPath>
        <g clipPath="url(#circle-clip)">
          <rect x="0" y="0" width="100" height="100" fill="url(#sunset-grad)" />
          {/* Horizon sun cut lines */}
          <rect x="0" y="54" width="100" height="2" fill="#110D2C" />
          <rect x="0" y="62" width="100" height="4" fill="#110D2C" />
          <rect x="0" y="72" width="100" height="6" fill="#110D2C" />
          <rect x="0" y="84" width="100" height="10" fill="#110D2C" />
          {/* Palm Tree silhouette */}
          <path d="M 50 95 Q 46 65 38 45" fill="none" stroke="#000" strokeWidth="5" strokeLinecap="round" />
          <path d="M 38 45 Q 20 48 12 58" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
          <path d="M 38 45 Q 22 36 15 22" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
          <path d="M 38 45 Q 42 22 55 18" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
          <path d="M 38 45 Q 55 40 68 50" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
        </g>
        <circle cx="50" cy="50" r="45" fill="none" stroke="#000" strokeWidth="4.5" />
        <defs>
          <linearGradient id="sunset-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF007F" />
            <stop offset="100%" stopColor="#FFE500" />
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    id: 'skull',
    name: 'Cosmic 3D Skull',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full select-none">
        <path d="M 25 45 C 25 15, 75 15, 75 45 C 75 60, 70 65, 65 65 L 65 85 C 65 90, 35 90, 35 85 L 35 65 C 30 65, 25 60, 25 45 Z" fill="#E2E8F0" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
        {/* Cool cyan retro sunglasses */}
        <polygon points="20 42, 80 42, 75 56, 54 56, 46 56, 25 56" fill="#00F0FF" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <line x1="28" y1="46" x2="42" y2="46" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="58" y1="46" x2="72" y2="46" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
        <polygon points="44 65, 50 56, 56 65" fill="#000" />
        <rect x="42" y="74" width="4" height="10" fill="#000" rx="1" />
        <rect x="54" y="74" width="4" height="10" fill="#000" rx="1" />
        <rect x="48" y="74" width="4" height="10" fill="#000" rx="1" />
      </svg>
    )
  },
  {
    id: 'star',
    name: 'Retro Star face',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full select-none">
        <path d="M 50 5 L 63 38 L 95 38 L 69 59 L 79 92 L 50 72 L 21 92 L 31 59 L 5 38 L 37 38 Z" fill="#FFE500" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
        <circle cx="41" cy="46" r="4" fill="#000" />
        <circle cx="59" cy="46" r="4" fill="#000" />
        <path d="M 44 56 Q 50 62 56 56" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'lightning',
    name: 'Lightning Bolt',
    render: () => (
      <svg viewBox="0 0 60 100" className="w-full h-full select-none">
        <path d="M 35 5 L 5 55 L 28 55 L 18 95 L 55 40 L 32 40 Z" fill="#FF00F0" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'rainbow',
    name: '80s Arc Rainbow',
    render: () => (
      <svg viewBox="0 0 100 70" className="w-full h-full select-none">
        <path d="M 10 65 A 40 40 0 0 1 90 65" fill="none" stroke="#FF0055" strokeWidth="8" strokeLinecap="round" />
        <path d="M 20 65 A 30 30 0 0 1 80 65" fill="none" stroke="#FFE500" strokeWidth="8" strokeLinecap="round" />
        <path d="M 30 65 A 20 20 0 0 1 70 65" fill="none" stroke="#00F0FF" strokeWidth="8" strokeLinecap="round" />
        <path d="M 40 65 A 10 10 0 0 1 60 65" fill="none" stroke="#A855F7" strokeWidth="8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'heart',
    name: 'Pixel Love Heart',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full select-none">
        <path d="M 50 88 L 12 50 L 12 28 L 28 12 L 50 34 L 72 12 L 88 28 L 88 50 Z" fill="#FF0055" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
        <rect x="24" y="24" width="10" height="10" fill="#FFF" opacity="0.75" />
      </svg>
    )
  },
  {
    id: 'peace',
    name: 'Psychedelic Peace',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full select-none">
        <circle cx="50" cy="50" r="43" fill="#A855F7" stroke="#000" strokeWidth="4.5" />
        <line x1="50" y1="7" x2="50" y2="93" stroke="#FFE500" strokeWidth="8" />
        <line x1="50" y1="50" x2="18" y2="80" stroke="#FFE500" strokeWidth="8" />
        <line x1="50" y1="50" x2="82" y2="80" stroke="#FFE500" strokeWidth="8" />
        <circle cx="50" cy="50" r="43" fill="none" stroke="#000" strokeWidth="5.5" />
      </svg>
    )
  },
  {
    id: 'cherries',
    name: 'Retro Sweet Cherries',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full select-none">
        <path d="M 60 20 Q 38 12 28 42" fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
        <path d="M 60 20 Q 55 32 65 52" fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
        <path d="M 50 16 C 53 8, 66 10, 68 18 C 62 23, 53 20, 50 16 Z" fill="#10B981" stroke="#000" strokeWidth="2.5" />
        <circle cx="28" cy="55" r="16" fill="#EF4444" stroke="#000" strokeWidth="4" />
        <circle cx="65" cy="62" r="16" fill="#EF4444" stroke="#000" strokeWidth="4" />
        <circle cx="22" cy="48" r="4.5" fill="#FFF" opacity="0.85" />
        <circle cx="59" cy="55" r="4.5" fill="#FFF" opacity="0.85" />
      </svg>
    )
  },
  {
    id: 'sparkles',
    name: 'Sparkle Stars',
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full select-none">
        <path d="M 50 10 Q 50 50 90 50 Q 50 50 50 90 Q 50 50 10 50 Q 50 50 50 10 Z" fill="#00F0FF" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" />
        <path d="M 75 12 Q 75 28 91 28 Q 75 28 75 44 Q 75 28 59 28 Q 75 28 75 12 Z" fill="#FFE500" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    )
  }
];

// --- VINTAGE STUDIO BACKGROUNDS ---
const BACKGROUND_PRESETS = [
  {
    id: 'checkers-pink-yellow',
    name: 'Acid Checkerboard',
    style: {
      backgroundImage: 'repeating-conic-gradient(#FF00F0 0% 25%, #FFE500 0% 50%)',
      backgroundSize: '32px 32px'
    }
  },
  {
    id: 'checkers-bw',
    name: 'Grunge Monochrome',
    style: {
      backgroundImage: 'repeating-conic-gradient(#111 0% 25%, #FFF 0% 50%)',
      backgroundSize: '24px 24px'
    }
  },
  {
    id: 'retro-grid',
    name: 'Outrun Neon Grid',
    style: {
      backgroundColor: '#0F0926',
      backgroundImage: `
        linear-gradient(to right, rgba(255, 0, 240, 0.3) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 0, 240, 0.3) 1px, transparent 1px)
      `,
      backgroundSize: '20px 20px'
    }
  },
  {
    id: 'retro-sunset',
    name: 'Synthwave Sunset Gradient',
    style: {
      background: 'linear-gradient(180deg, #FF0055 0%, #FF8500 45%, #FFE500 80%, #00F0FF 100%)'
    }
  },
  {
    id: 'blueprint-grid',
    name: 'Chamber Grid',
    style: {
      backgroundColor: '#004BFF',
      backgroundImage: `
        linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px)
      `,
      backgroundSize: '16px 16px'
    }
  },
  {
    id: 'neon-slime',
    name: 'Radioactive Waste',
    style: {
      background: 'radial-gradient(circle, #39FF14 10%, #121810 90%)',
      backgroundImage: 'radial-gradient(circle, #39FF14 15%, #0B0E09 85%)'
    }
  },
  {
    id: 'pastel-memphis',
    name: 'Vintage Memphis',
    style: {
      backgroundColor: '#FCE7F3',
      backgroundImage: 'radial-gradient(#A855F7 12%, transparent 12%), radial-gradient(#F43F5E 12%, transparent 12%)',
      backgroundSize: '24px 24px',
      backgroundPosition: '0 0, 12px 12px'
    }
  },
  {
    id: 'solid-slate',
    name: 'Brutalist Matte Charcoal',
    style: { backgroundColor: '#1A1A24' }
  }
];

// --- DEFAULT COVER COMPOSTION ---
const DEFAULT_STICKERS_COMPOSITION = [
  { id: 'def-t1', type: 'text', text: 'SIGNAL / NOISE LAB', x: 50, y: 44, scale: 1.5, rotate: -3, color: '#FFE500', font: 'Impact', fontStyle: 'retro-3d', holo: true, peel: 0 },
  { id: 'def-s1', type: 'sticker', value: 'cool-smiley', x: 16, y: 46, scale: 1.2, rotate: 15, holo: false, peel: 12 },
  { id: 'def-s2', type: 'sticker', value: 'cassette', x: 84, y: 55, scale: 1.15, rotate: -12, holo: true, peel: 0 },
  { id: 'def-s3', type: 'sticker', value: 'sparkles', x: 67, y: 30, scale: 0.9, rotate: 10, holo: true, peel: 0 },
  { id: 'def-s4', type: 'sticker', value: 'alien', x: 34, y: 74, scale: 0.85, rotate: -20, holo: false, peel: 0 }
];

// --- START COMPOSITION TEMPLATES ---
const COMPOSITION_TEMPLATES = [
  {
    name: '⚡️ RAD OUTRUN',
    preset: 'retro-sunset',
    stickers: [
      { id: 't-1', type: 'text', text: 'RETRO CRUISE', x: 50, y: 38, scale: 1.6, rotate: -4, color: '#00F0FF', font: 'Impact', fontStyle: 'retro-3d', holo: true, peel: 0 },
      { id: 's-1', type: 'sticker', value: 'palm-tree', x: 20, y: 44, scale: 1.25, rotate: 8, holo: false, peel: 0 },
      { id: 's-2', type: 'sticker', value: 'cassette', x: 80, y: 55, scale: 1.15, rotate: -15, holo: true, peel: 15 },
      { id: 's-3', type: 'sticker', value: 'sparkles', x: 68, y: 22, scale: 0.85, rotate: 15, holo: true, peel: 0 }
    ]
  },
  {
    name: '👽 ACID NEON',
    preset: 'neon-slime',
    stickers: [
      { id: 't-2', type: 'text', text: 'ZAP THE NOISE', x: 50, y: 48, scale: 1.5, rotate: 4, color: '#39FF14', font: 'Impact', fontStyle: 'retro-3d', holo: true, peel: 12 },
      { id: 's-4', type: 'sticker', value: 'alien', x: 18, y: 48, scale: 1.3, rotate: -12, holo: true, peel: 0 },
      { id: 's-5', type: 'sticker', value: 'lightning', x: 82, y: 45, scale: 1.1, rotate: 20, holo: false, peel: 0 },
      { id: 's-6', type: 'sticker', value: 'star', x: 48, y: 80, scale: 0.85, rotate: 5, holo: false, peel: 0 }
    ]
  },
  {
    name: '📻 BRUTALIST 90s',
    preset: 'checkers-bw',
    stickers: [
      { id: 't-3', type: 'text', text: 'ANALOG CHANNELS', x: 50, y: 40, scale: 1.45, rotate: -2, color: '#FFE500', font: 'Impact', fontStyle: 'retro-3d', holo: true, peel: 0 },
      { id: 's-7', type: 'sticker', value: 'floppy', x: 22, y: 56, scale: 1.2, rotate: 14, holo: false, peel: 15 },
      { id: 's-8', type: 'sticker', value: 'yin-yang', x: 78, y: 42, scale: 1.15, rotate: -25, holo: true, peel: 0 },
      { id: 's-9', type: 'sticker', value: 'skull', x: 48, y: 78, scale: 0.9, rotate: 0, holo: false, peel: 0 }
    ]
  }
];

export default function ChannelCover() {
  const [bgPresetId, setBgPresetId] = useState('retro-sunset');
  const [stickers, setStickers] = useState(DEFAULT_STICKERS_COMPOSITION);

  // Studio Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editBgPresetId, setEditBgPresetId] = useState('retro-sunset');
  const [editStickers, setEditStickers] = useState([]);
  const [activeStickerId, setActiveStickerId] = useState(null);

  // Scanline CRT visual effect toggle in canvas
  const [crtEnabled, setCrtEnabled] = useState(true);

  // Sticker text spawner state
  const [textVal, setTextVal] = useState('');
  const [textFont, setTextFont] = useState('Impact');
  const [textColor, setTextColor] = useState('#FFE500');

  // Dragging states
  const [draggingStickerId, setDraggingStickerId] = useState(null);
  const canvasRef = useRef(null);

  // Load persistence on mount
  useEffect(() => {
    const savedPreset = localStorage.getItem('channel_cover_preset');
    const savedStickersStr = localStorage.getItem('channel_cover_stickers');

    if (savedPreset) setBgPresetId(savedPreset);
    if (savedStickersStr) {
      try {
        setStickers(JSON.parse(savedStickersStr));
      } catch (e) {
        setStickers(DEFAULT_STICKERS_COMPOSITION);
      }
    }
  }, []);

  const openDesigner = () => {
    playRetroSound('click');
    setEditBgPresetId(bgPresetId);
    setEditStickers(JSON.parse(JSON.stringify(stickers)));
    setIsModalOpen(true);
    setActiveStickerId(null);
    setTextVal('');
  };

  const closeModal = () => {
    playRetroSound('click');
    setIsModalOpen(false);
    setDraggingStickerId(null);
  };

  const saveChanges = () => {
    playRetroSound('stick');
    setBgPresetId(editBgPresetId);
    setStickers(editStickers);

    localStorage.setItem('channel_cover_preset', editBgPresetId);
    localStorage.setItem('channel_cover_stickers', JSON.stringify(editStickers));

    setIsModalOpen(false);
  };

  // Drag handlers with sound triggers
  const handleStickerStartDrag = (e, id) => {
    e.stopPropagation();
    playRetroSound('peel');
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

    // Boundary constraints
    x = Math.max(-5, Math.min(105, x));
    y = Math.max(-5, Math.min(105, y));

    setEditStickers(prev =>
      prev.map(s => (s.id === draggingStickerId ? { ...s, x, y } : s))
    );
  };

  const stopDragging = () => {
    if (draggingStickerId) {
      playRetroSound('stick');
      setDraggingStickerId(null);
    }
  };

  const addStickerToCanvas = (stickerId) => {
    playRetroSound('spawn');
    const newSticker = {
      id: `st-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'sticker',
      value: stickerId,
      x: 50,
      y: 50,
      scale: 1.0,
      rotate: 0,
      holo: false,
      peel: 0
    };
    setEditStickers([...editStickers, newSticker]);
    setActiveStickerId(newSticker.id);
  };

  const addTextSticker = () => {
    if (!textVal.trim()) return;
    playRetroSound('spawn');
    const newText = {
      id: `txt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'text',
      text: textVal.trim().toUpperCase(),
      x: 50,
      y: 50,
      scale: 1.25,
      rotate: -3,
      color: textColor,
      font: textFont,
      fontStyle: 'retro-3d',
      holo: false,
      peel: 0
    };
    setEditStickers([...editStickers, newText]);
    setActiveStickerId(newText.id);
    setTextVal('');
  };

  const deleteSticker = (id) => {
    playRetroSound('delete');
    setEditStickers(editStickers.filter(s => s.id !== id));
    if (activeStickerId === id) {
      setActiveStickerId(null);
    }
  };

  const updateActiveSticker = (key, value) => {
    if (!activeStickerId) return;
    setEditStickers(prev =>
      prev.map(s => (s.id === activeStickerId ? { ...s, [key]: value } : s))
    );
  };

  const changeStickerLayer = (direction) => {
    if (!activeStickerId) return;
    playRetroSound('click');
    const index = editStickers.findIndex(s => s.id === activeStickerId);
    if (index === -1) return;

    const newStickers = [...editStickers];
    if (direction === 'up' && index < newStickers.length - 1) {
      const temp = newStickers[index];
      newStickers[index] = newStickers[index + 1];
      newStickers[index + 1] = temp;
      setEditStickers(newStickers);
    } else if (direction === 'down' && index > 0) {
      const temp = newStickers[index];
      newStickers[index] = newStickers[index - 1];
      newStickers[index - 1] = temp;
      setEditStickers(newStickers);
    }
  };

  const loadTemplate = (template) => {
    playRetroSound('template');
    setEditBgPresetId(template.preset);
    setEditStickers(JSON.parse(JSON.stringify(template.stickers)));
    setActiveStickerId(null);
  };

  // Holographic shine mouse tracker on hover
  const handleHoloMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty('--holo-x', `${x}%`);
    e.currentTarget.style.setProperty('--holo-y', `${y}%`);
  };

  const activeSticker = editStickers.find(s => s.id === activeStickerId);
  const currentPreset = BACKGROUND_PRESETS.find(p => p.id === bgPresetId) || BACKGROUND_PRESETS[3];
  const editCurrentPreset = BACKGROUND_PRESETS.find(p => p.id === editBgPresetId) || BACKGROUND_PRESETS[3];

  const FONTS_LIST = [
    { value: 'Impact', label: 'Retro 3D Impact' },
    { value: '"Space Grotesk", sans-serif', label: 'Modern Grotesk' },
    { value: '"Courier New", monospace', label: 'Floppy Courier' },
    { value: '"Georgia", serif', label: 'Vintage Serif' }
  ];

  return (
    <div id="channel-cover-studio-container" className="w-full relative mb-6 group">
      
      {/* 1. PUBLIC CHANNEL BANNER DISPLAY */}
      <div
        style={currentPreset.style}
        className="w-full h-40 sm:h-48 md:h-56 rounded-2xl border-4 border-[#121216] overflow-hidden relative shadow-2xl transition duration-300"
      >
        {/* Render Stickers Vector Stage */}
        <div className="w-full h-full relative overflow-hidden select-none">
          {stickers.map((s) => {
            const transformStyle = `translate(-50%, -50%) scale(${s.scale || 1}) rotate(${s.rotate || 0}deg)`;
            const peelVal = s.peel || 0;
            
            // Vector page curl clipping style
            const clipPathStyle = peelVal > 0 
              ? `polygon(0% 0%, ${100 - peelVal}% 0%, 100% ${peelVal}%, 100% 100%, 0% 100%)`
              : undefined;

            const styleBase = {
              left: `${s.x}%`,
              top: `${s.y}%`,
              transform: transformStyle,
              zIndex: s.zIndex || 10,
              // Die cut thick white border with outer drop shadow
              filter: `
                drop-shadow(1.5px 1.5px 0px #fff) 
                drop-shadow(-1.5px -1.5px 0px #fff) 
                drop-shadow(1.5px -1.5px 0px #fff) 
                drop-shadow(-1.5px 1.5px 0px #fff) 
                drop-shadow(2px 2px 0px #000)
                drop-shadow(3px 4px 5px rgba(0,0,0,0.45))
              `,
              clipPath: clipPathStyle
            };

            return (
              <div key={s.id} style={styleBase} className="absolute pointer-events-none select-none">
                <div className="relative w-full h-full flex items-center justify-center">
                  {s.type === 'text' ? (
                    <span
                      style={{
                        fontFamily: s.font,
                        color: s.color,
                        fontSize: '22px',
                        lineHeight: '1',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        textShadow: `
                          2px 2px 0px #000,
                          -0.5px -0.5px 0px #000,
                          0.5px -0.5px 0px #000,
                          -0.5px 0.5px 0px #000,
                          0.5px 0.5px 0px #000
                        `
                      }}
                      className="block px-1 select-none"
                    >
                      {s.text}
                    </span>
                  ) : (
                    <div className="w-14 h-14 select-none">
                      {STICKERS_CATALOG.find(c => c.id === s.value)?.render()}
                    </div>
                  )}

                  {/* Holographic foil overlay filter */}
                  {s.holo && (
                    <div 
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0) 20%, rgba(255,0,240,0.3) 35%, rgba(0,240,255,0.35) 50%, rgba(255,229,0,0.25) 65%, rgba(255,255,255,0) 80%)',
                        backgroundSize: '200% 200%',
                        animation: 'themeInfiniteGridPan 6s linear infinite',
                        mixBlendMode: 'color-dodge',
                      }}
                      className="absolute inset-0 rounded-md pointer-events-none"
                    />
                  )}

                  {/* Fold corner backing */}
                  {peelVal > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        width: `${peelVal}%`,
                        height: `${peelVal}%`,
                        background: 'linear-gradient(135deg, #111 0%, #aaa 35%, #fff 70%, #999 100%)',
                        borderLeft: '1px solid #111',
                        borderBottom: '1px solid #111',
                        zIndex: 2,
                        transformOrigin: 'top right',
                        transform: 'scaleX(-1) rotate(-90deg)',
                        boxShadow: '-1px 1px 2px rgba(0,0,0,0.5)'
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action customize button overlay */}
        <button
          onClick={openDesigner}
          className="absolute right-4 bottom-4 bg-[#121216] hover:bg-black text-[#FFE500] hover:text-white text-[10px] uppercase font-extrabold tracking-widest px-3 py-2 rounded-xl border-2 border-[#FFE500]/40 flex items-center gap-1.5 transition duration-150 shadow-2xl transform active:scale-95 cursor-pointer z-20"
        >
          <Palette size={13} className="text-pink-500 animate-spin-slow" />
          <span>Customize Cover</span>
        </button>
      </div>

      {/* 2. CHROME-BEVEL RETRO STUDIO MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#000]/80 flex items-center justify-center p-2 sm:p-4 z-[999] overflow-y-auto backdrop-blur-md animate-fade-in">
          
          {/* Classic 90s OS Beveled Window Frame */}
          <div className="bg-[#D1D5DB] border-4 border-t-white border-l-white border-r-[#555] border-b-[#555] w-full max-w-5xl rounded-lg flex flex-col overflow-hidden max-h-[96vh] sm:max-h-[92vh] shadow-2xl p-1">
            
            {/* Title Bar */}
            <div className="bg-gradient-to-r from-[#000080] to-[#1084D0] px-3 py-1.5 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#FFE500] animate-bounce" />
                <span className="text-white text-xs font-bold font-mono tracking-tight uppercase">
                  STICKER_STUDIO_98.EXE - CUSTOM BANNER CONTROLS
                </span>
              </div>
              <div className="flex gap-1">
                {/* Minimize Button */}
                <button 
                  onClick={closeModal}
                  className="w-5 h-5 bg-[#D1D5DB] text-black border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white text-[10px] font-extrabold flex items-center justify-center animate-none"
                >
                  _
                </button>
                {/* Close Button */}
                <button 
                  onClick={closeModal}
                  className="w-5 h-5 bg-[#D1D5DB] hover:bg-rose-600 hover:text-white text-black border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white text-[10px] font-extrabold flex items-center justify-center animate-none"
                >
                  X
                </button>
              </div>
            </div>

            {/* Menu Bar bar */}
            <div className="bg-[#D1D5DB] border-b border-[#888] px-3 py-1 text-[11px] font-mono font-bold text-gray-800 flex items-center gap-4 select-none">
              <span>File</span>
              <span>Edit</span>
              <span>Presets</span>
              <div className="flex-1" />
              <div className="flex items-center gap-1.5 text-pink-600">
                <Music size={11} className="animate-pulse" />
                <span>8-Bit Synth Active</span>
              </div>
            </div>

            {/* Studio Navigation Options Header (Clean 90s bezel) */}
            <div className="bg-[#BCBCBC] p-1 border-b border-[#888] select-none">
              <div className="py-2 px-3 text-xs font-bold font-mono text-pink-600 bg-[#EAEAEA] border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white shadow-inner flex items-center gap-2">
                <Palette size={14} className="animate-pulse" />
                <span>[RETRO STICKER DESIGNER WORKSPACE]</span>
              </div>
            </div>

            {/* Workspace Canvas and Controls Wrapper */}
            <div className="flex-1 overflow-y-auto p-3 bg-[#C0C0C0] flex flex-col gap-3">
              
              {/* STAGE CONTAINER WITH CRT SCANLINES */}
              <div className="bg-slate-950 p-1.5 rounded border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white relative">
                <div className="text-[10px] text-gray-400 font-mono flex justify-between mb-1 select-none">
                  <span>LIVE DIGITAL DESIGN STAGE</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCrtEnabled(!crtEnabled)}
                      className={`px-1.5 py-0.5 text-[9px] border font-bold ${
                        crtEnabled 
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400' 
                          : 'border-slate-700 bg-slate-900 text-slate-500'
                      }`}
                    >
                      CRT Scanlines: {crtEnabled ? 'ON' : 'OFF'}
                    </button>
                    <span className="text-[#FFE500] animate-pulse">DRAG & CLICK INDIVIDUAL STICKERS TO CONTROL</span>
                  </div>
                </div>

                <div
                  ref={canvasRef}
                  style={editCurrentPreset.style}
                  onMouseMove={handleCanvasMouseMove}
                  onTouchMove={handleCanvasMouseMove}
                  onMouseUp={stopDragging}
                  onTouchEnd={stopDragging}
                  onMouseLeave={stopDragging}
                  className="w-full h-36 sm:h-44 md:h-52 overflow-hidden relative shadow-inner select-none bg-slate-900 border border-slate-800"
                >
                  {/* Interactive Drag and Customise Canvas */}
                  <div className="w-full h-full absolute inset-0">
                    {editStickers.map((s) => {
                      const isSelected = s.id === activeStickerId;
                      const isDragging = s.id === draggingStickerId;
                      const currentScale = (s.scale || 1) * (isDragging ? 1.15 : 1);
                      const transformStyle = `translate(-50%, -50%) scale(${currentScale}) rotate(${s.rotate || 0}deg)`;
                      const peelVal = s.peel || 0;
                      const clipPathStyle = peelVal > 0 
                        ? `polygon(0% 0%, ${100 - peelVal}% 0%, 100% ${peelVal}%, 100% 100%, 0% 100%)`
                        : undefined;

                      const itemStyle = {
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        transform: transformStyle,
                        zIndex: isSelected ? 99 : (editStickers.indexOf(s) + 10),
                        filter: isDragging
                          ? `
                            drop-shadow(1.5px 1.5px 0px #fff) 
                            drop-shadow(-1.5px -1.5px 0px #fff) 
                            drop-shadow(1.5px -1.5px 0px #fff) 
                            drop-shadow(-1.5px 1.5px 0px #fff) 
                            drop-shadow(4px 4px 0px #000)
                            drop-shadow(8px 12px 14px rgba(0,0,0,0.45))
                          `
                          : `
                            drop-shadow(1.5px 1.5px 0px #fff) 
                            drop-shadow(-1.5px -1.5px 0px #fff) 
                            drop-shadow(1.5px -1.5px 0px #fff) 
                            drop-shadow(-1.5px 1.5px 0px #fff) 
                            drop-shadow(2px 2px 0px #000)
                            drop-shadow(3px 4px 5px rgba(0,0,0,0.35))
                          `,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        clipPath: clipPathStyle
                      };

                      return (
                        <div
                          key={s.id}
                          onMouseDown={(e) => handleStickerStartDrag(e, s.id)}
                          onTouchStart={(e) => handleStickerStartDrag(e, s.id)}
                          onMouseMove={s.holo ? handleHoloMouseMove : undefined}
                          style={itemStyle}
                          className={`absolute select-none p-1 transition-shadow duration-100 ${
                            isSelected ? 'ring-2 ring-[#FFE500] ring-offset-2 ring-offset-slate-950 rounded' : ''
                          }`}
                        >
                          <div className="relative w-full h-full flex items-center justify-center">
                            {s.type === 'text' ? (
                              <span
                                style={{
                                  fontFamily: s.font,
                                  color: s.color,
                                  fontSize: '20px',
                                  fontWeight: 'bold',
                                  whiteSpace: 'nowrap',
                                  textShadow: `
                                    2px 2px 0px #000,
                                    -0.5px -0.5px 0px #000,
                                    0.5px -0.5px 0px #000,
                                    -0.5px 0.5px 0px #000,
                                    0.5px 0.5px 0px #000
                                  `
                                }}
                                className="block select-none"
                              >
                                {s.text}
                              </span>
                            ) : (
                              <div className="w-12 h-12 select-none">
                                {STICKERS_CATALOG.find(c => c.id === s.value)?.render()}
                              </div>
                            )}

                            {/* Interactive Holographic Gloss Overlay */}
                            {s.holo && (
                              <div 
                                style={{
                                  background: 'radial-gradient(circle at var(--holo-x, 50%) var(--holo-y, 50%), rgba(255,255,255,0.7) 0%, rgba(255,0,240,0.3) 30%, rgba(0,240,255,0.3) 60%, rgba(255,255,255,0) 100%)',
                                  mixBlendMode: 'color-dodge',
                                }}
                                className="absolute inset-0 rounded pointer-events-none"
                              />
                            )}

                            {/* Vector Page peel folded corner */}
                            {peelVal > 0 && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '0',
                                  right: '0',
                                  width: `${peelVal}%`,
                                  height: `${peelVal}%`,
                                  background: 'linear-gradient(135deg, #222 0%, #aaa 35%, #fff 70%, #999 100%)',
                                  borderLeft: '1px solid #111',
                                  borderBottom: '1px solid #111',
                                  zIndex: 2,
                                  transformOrigin: 'top right',
                                  transform: 'scaleX(-1) rotate(-90deg)'
                                }}
                              />
                            )}
                          </div>

                          {/* Floating individual delete button */}
                          {isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSticker(s.id);
                              }}
                              className="absolute -top-3.5 -right-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 border-2 border-black shadow-lg cursor-pointer transition active:scale-90"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Toggable CRT Retro Screen Scanline Filter Overlay */}
                  {crtEnabled && (
                    <div 
                      style={{
                        backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
                        backgroundSize: '100% 4px',
                        pointerEvents: 'none'
                      }}
                      className="absolute inset-0 z-50 opacity-40 select-none"
                    />
                  )}
                  {crtEnabled && (
                    <div className="absolute inset-0 bg-emerald-500/5 mix-blend-color-dodge z-40 pointer-events-none select-none animate-pulse" />
                  )}
                </div>
              </div>

              {/* CONTROLS COLUMNS */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                
                {/* Left Controls Box: Templates, Spawning, Backgrounds */}
                <div className="md:col-span-8 flex flex-col gap-3">
                  
                  {/* 1. Quick compositions templates */}
                  <div className="bg-[#D1D5DB] border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white p-3 rounded">
                    <h4 className="text-[10px] font-bold text-gray-800 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Layers size={12} className="text-blue-700" />
                      <span>Instant Studio Templates</span>
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {COMPOSITION_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.name}
                          onClick={() => loadTemplate(tpl)}
                          className="bg-[#C0C0C0] hover:bg-slate-300 border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white text-[10px] font-bold font-mono text-gray-900 py-1.5 px-2 text-center transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>{tpl.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Choose background presets */}
                  <div className="bg-[#D1D5DB] border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white p-3 rounded">
                    <h4 className="text-[10px] font-bold text-gray-800 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Palette size={12} className="text-emerald-700" />
                      <span>Background Skins Catalog</span>
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {BACKGROUND_PRESETS.map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => { playRetroSound('click'); setEditBgPresetId(bg.id); }}
                          style={bg.style}
                          title={bg.name}
                          className={`h-9 rounded border-2 transition transform active:scale-95 relative ${
                            editBgPresetId === bg.id
                              ? 'border-white scale-105 shadow-md shadow-black'
                              : 'border-[#444] hover:border-white'
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

                  {/* 3. Sticker catalog box */}
                  <div className="bg-[#D1D5DB] border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white p-3 rounded">
                    <h4 className="text-[10px] font-bold text-gray-800 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-pink-600" />
                      <span>Stickers Spawner Catalog</span>
                    </h4>
                    <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                      {STICKERS_CATALOG.map((st) => (
                        <button
                          key={st.id}
                          onClick={() => addStickerToCanvas(st.id)}
                          title={st.name}
                          className="bg-[#C0C0C0] hover:bg-[#E0E0E0] border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white p-1.5 rounded flex items-center justify-center transition-all transform active:scale-95 cursor-pointer aspect-square"
                        >
                          <div className="w-8 h-8 hover:rotate-6 transition">
                            {st.render()}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Text spawner */}
                  <div className="bg-[#D1D5DB] border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white p-3 rounded">
                    <h4 className="text-[10px] font-bold text-gray-800 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText size={12} className="text-blue-700" />
                      <span>Retro Text badge Spawner</span>
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={textVal}
                        onChange={(e) => setTextVal(e.target.value)}
                        maxLength={32}
                        placeholder="TYPE RETRO BADGE TEXT..."
                        className="flex-1 bg-white border border-[#888] font-mono font-bold text-xs px-2.5 py-1.5 focus:outline-none focus:border-pink-500 uppercase"
                      />
                      <div className="flex gap-2 justify-between">
                        <select
                          value={textFont}
                          onChange={(e) => setTextFont(e.target.value)}
                          className="bg-[#D1D5DB] font-mono text-[10px] font-bold border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] px-1.5 py-1"
                        >
                          {FONTS_LIST.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                        <div className="flex gap-1 items-center bg-white px-1 border border-[#888]">
                          {['#FFE500', '#FF00F0', '#00F0FF', '#39FF14', '#FFFFFF'].map((c) => (
                            <button
                              key={c}
                              onClick={() => setTextColor(c)}
                              style={{ backgroundColor: c }}
                              className={`w-4 h-4 rounded-full border border-black/50 ${
                                textColor === c ? 'ring-1 ring-black scale-110' : ''
                              }`}
                            />
                          ))}
                        </div>
                        <button
                          onClick={addTextSticker}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-[10px] px-3.5 py-1.5 border-2 border-t-indigo-400 border-l-indigo-400 border-r-indigo-900 border-b-indigo-900 cursor-pointer active:scale-95 animate-none"
                        >
                          SPAWN
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Controls Box: Selected Active Sticker parameters */}
                <div className="md:col-span-4 flex flex-col gap-3">
                  <div className="bg-[#D1D5DB] border-2 border-t-[#555] border-l-[#555] border-r-white border-b-white p-3 rounded flex-1 flex flex-col">
                    <h4 className="text-[10px] font-bold text-gray-800 font-mono uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Settings size={12} className="text-yellow-600" />
                      <span>Active Controls Panel</span>
                    </h4>

                    {activeSticker ? (
                      <div className="flex-1 flex flex-col gap-4">
                        {/* Selected Info Card */}
                        <div className="bg-[#EAEAEA] border border-[#888] p-2 rounded flex items-center gap-2 select-none">
                          <div className="w-9 h-9 bg-slate-900 border border-slate-700 rounded flex items-center justify-center p-1">
                            {activeSticker.type === 'text' ? (
                              <span className="font-mono font-bold text-[9px] text-[#FFE500]">TXT</span>
                            ) : (
                              STICKERS_CATALOG.find(c => c.id === activeSticker.value)?.render()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[8px] font-bold text-gray-500 font-mono">SELECTED ITEM</p>
                            <p className="text-[11px] font-bold text-black truncate font-mono">
                              {activeSticker.type === 'text' ? `"${activeSticker.text}"` : STICKERS_CATALOG.find(c => c.id === activeSticker.value)?.name}
                            </p>
                          </div>
                        </div>

                        {/* Holographic foil Toggle */}
                        <div className="bg-[#EAEAEA] border border-[#888] p-2 rounded flex items-center justify-between">
                          <div className="flex items-center gap-1.5 select-none">
                            <Sparkles size={11} className="text-pink-500 animate-pulse" />
                            <span className="text-[10px] font-bold font-mono text-gray-800">Holographic foil?</span>
                          </div>
                          <div className="relative inline-flex items-center cursor-pointer">
                            <input
                              id="holoFoilToggle"
                              type="checkbox"
                              className="sr-only peer"
                              checked={Boolean(activeSticker.holo)}
                              onChange={(e) => { playRetroSound('click'); updateActiveSticker('holo', e.target.checked); }}
                            />
                            <label htmlFor="holoFoilToggle" className="w-9 h-5 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600 cursor-pointer" />
                          </div>
                        </div>

                        {/* Peel Corner Fold Slider */}
                        <div className="space-y-1 bg-[#EAEAEA] border border-[#888] p-2 rounded">
                          <div className="flex justify-between text-[10px] font-bold font-mono text-gray-800 select-none">
                            <span>Corner Peel fold</span>
                            <span className="text-pink-600">{activeSticker.peel || 0}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            step="2"
                            value={activeSticker.peel || 0}
                            onChange={(e) => updateActiveSticker('peel', parseInt(e.target.value))}
                            className="w-full cursor-pointer accent-pink-600"
                          />
                        </div>

                        {/* Scale parameter slider */}
                        <div className="space-y-1 bg-[#EAEAEA] border border-[#888] p-2 rounded">
                          <div className="flex justify-between text-[10px] font-bold font-mono text-gray-800 select-none">
                            <span>Scale Factor</span>
                            <span className="text-pink-600">{activeSticker.scale ? activeSticker.scale.toFixed(1) : '1.0'}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="3.0"
                            step="0.1"
                            value={activeSticker.scale || 1.0}
                            onChange={(e) => updateActiveSticker('scale', parseFloat(e.target.value))}
                            className="w-full cursor-pointer accent-indigo-600"
                          />
                        </div>

                        {/* Rotation slider */}
                        <div className="space-y-1 bg-[#EAEAEA] border border-[#888] p-2 rounded">
                          <div className="flex justify-between text-[10px] font-bold font-mono text-gray-800 select-none">
                            <span>Rotation angle</span>
                            <span className="text-pink-600">{activeSticker.rotate || 0}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={activeSticker.rotate || 0}
                            onChange={(e) => updateActiveSticker('rotate', parseInt(e.target.value))}
                            className="w-full cursor-pointer accent-emerald-600"
                          />
                        </div>

                        {/* Zlayer Depth management */}
                        <div className="space-y-1.5 bg-[#EAEAEA] border border-[#888] p-2 rounded">
                          <label className="text-[10px] font-bold font-mono text-gray-800 block select-none">Layer depth Ordering</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => changeStickerLayer('up')}
                              className="bg-[#D1D5DB] border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white py-1 px-2 text-[10px] font-bold font-mono flex items-center justify-center gap-1 cursor-pointer animate-none"
                            >
                              <MoveUp size={11} className="text-blue-700" />
                              <span>LAYER UP</span>
                            </button>
                            <button
                              onClick={() => changeStickerLayer('down')}
                              className="bg-[#D1D5DB] border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white py-1 px-2 text-[10px] font-bold font-mono flex items-center justify-center gap-1 cursor-pointer animate-none"
                            >
                              <MoveDown size={11} className="text-orange-700" />
                              <span>LAYER DOWN</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex-1" />

                        {/* Trash Delete Action */}
                        <button
                          onClick={() => deleteSticker(activeStickerId)}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-700 hover:text-rose-800 border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white py-2 px-3 text-[10px] font-bold font-mono flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>DELETE SELECTED ITEM</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center text-gray-500 border-2 border-dashed border-[#888] bg-[#EAEAEA] p-4 py-8 rounded select-none">
                        <Palette size={22} className="opacity-40 animate-bounce" />
                        <p className="text-[10px] font-bold font-mono max-w-[170px] leading-relaxed">
                          Click on any sticker inside the workspace stage above to unlock designer parameters!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Modal actions footer */}
            <div className="p-3 border-t border-[#888] bg-[#D1D5DB] flex items-center justify-between gap-3 select-none">
              <p className="text-[10px] font-mono text-gray-700 max-w-[340px] hidden sm:block">
                SYS: BANNERS SAVED LOCALLY WILL RENDER LIVE ON YOUR PUBLIC CHANNELS IMMEDIATELY.
              </p>
              <div className="flex gap-2 justify-end w-full sm:w-auto">
                <button
                  onClick={closeModal}
                  className="px-4 py-1.5 text-xs font-bold font-mono text-gray-900 bg-[#C0C0C0] hover:bg-[#B2B2B2] border-2 border-t-white border-l-white border-r-[#555] border-b-[#555] active:border-t-[#555] active:border-l-[#555] active:border-r-white active:border-b-white cursor-pointer"
                >
                  [DISCARD]
                </button>
                <button
                  onClick={saveChanges}
                  className="bg-[#000080] hover:bg-blue-900 text-white text-xs font-bold font-mono px-5 py-2.5 border-2 border-t-[#5050FF] border-l-[#5050FF] border-r-[#000020] border-b-[#000020] flex items-center gap-1.5 shadow active:scale-95 cursor-pointer animate-none"
                >
                  <Check size={14} className="text-[#FFE500]" />
                  <span>[APPLY BANNER]</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
