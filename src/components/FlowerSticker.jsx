import { useState, useEffect } from 'react'

export default function FlowerSticker({ selectedFlower = 'sunflower', size = 56, onClick }) {
  const [isHovered, setIsHovered] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Define flower options with titles, pricing and colors matching the seed catalogue
  const flowerData = {
    sunflower: {
      name: 'HELIANTHUS',
      commonName: 'Octopus Sunflower',
      price: '10¢',
      theme: '#e5a93b',
      badgeBg: '#ffd54f',
      badgeText: '#5d4037',
      svg: (
        <svg className="sticker-flower-svg sticker-sway" viewBox="0 0 100 100">
          <defs>
            <radialGradient id="sticker-sun-center" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4a2c0f" />
              <stop offset="70%" stopColor="#2b1400" />
              <stop offset="100%" stopColor="#1a0a00" />
            </radialGradient>
            <linearGradient id="sticker-tentacle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd54f" />
              <stop offset="60%" stopColor="#ffb300" />
              <stop offset="100%" stopColor="#f57c00" />
            </linearGradient>
          </defs>
          <path d="M50,55 Q52,85 48,95" stroke="#4e6e2f" strokeWidth="3.5" fill="none" />
          <path d="M50,75 Q35,70 42,62" stroke="#4e6e2f" strokeWidth="2.5" fill="none" />
          <path d="M42,62 Q35,62 38,70" fill="#5d8a38" />
          <g>
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
              <path
                key={i}
                d="M50,50 Q65,30 55,10 Q45,28 50,50"
                fill="url(#sticker-tentacle-grad)"
                transform={`rotate(${angle} 50 50)`}
              />
            ))}
          </g>
          <circle cx="50" cy="50" r="14" fill="url(#sticker-sun-center)" stroke="#ffb300" strokeWidth="1" />
          <circle cx="50" cy="50" r="10" fill="none" stroke="#e5a93b" strokeWidth="1.5" strokeDasharray="2,2" />
        </svg>
      )
    },
    rose: {
      name: 'ROSA CYBERNETICA',
      commonName: 'Glitch Rose',
      price: '1/-',
      theme: '#d81b60',
      badgeBg: '#f8bbd0',
      badgeText: '#880e4f',
      svg: (
        <svg className="sticker-flower-svg sticker-glitch" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="sticker-rose-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#00838f" />
            </linearGradient>
            <linearGradient id="sticker-rose-magenta" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff007f" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#880e4f" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path d="M50,52 Q47,80 53,95" stroke="#2d5a27" strokeWidth="3.5" fill="none" />
          <path d="M48,70 L40,65 L48,62 Z" fill="#2d5a27" />
          <path d="M51,78 L60,75 L52,70 Z" fill="#2d5a27" />
          <g className="sticker-glitch-cyan" transform="translate(-1, 0.5)">
            <circle cx="50" cy="45" r="15" fill="none" stroke="url(#sticker-rose-cyan)" strokeWidth="2" />
            <path d="M50,22 C35,25 35,45 50,55 C65,45 65,25 50,22 Z" fill="url(#sticker-rose-cyan)" opacity="0.4" />
          </g>
          <g className="sticker-glitch-magenta" transform="translate(1, -0.5)">
            <path d="M50,20 C32,23 32,45 50,58 C68,45 68,23 50,20 Z" fill="url(#sticker-rose-magenta)" />
            <path d="M50,26 C38,29 38,45 50,52 C62,45 62,29 50,26 Z" fill="#b71c1c" />
            <path d="M50,32 C43,34 43,45 50,48 C57,45 57,34 50,32 Z" fill="#ff4081" />
            <circle cx="50" cy="40" r="4" fill="#ffffff" opacity="0.8" />
          </g>
        </svg>
      )
    },
    poppy: {
      name: 'PAPAVER RUBEUS',
      commonName: 'Signal Poppy',
      price: '5¢',
      theme: '#e53935',
      badgeBg: '#ffcdd2',
      badgeText: '#b71c1c',
      svg: (
        <svg className="sticker-flower-svg sticker-pulse" viewBox="0 0 100 100">
          <defs>
            <radialGradient id="sticker-poppy-center" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#111111" />
              <stop offset="80%" stopColor="#222222" />
              <stop offset="100%" stopColor="#050505" />
            </radialGradient>
          </defs>
          <path d="M50,50 L50,95" stroke="#388e3c" strokeWidth="2.5" strokeDasharray="1,1" fill="none" />
          <g>
            <circle cx="50" cy="45" r="24" fill="none" stroke="#b71c1c" strokeWidth="1" strokeDasharray="3,3" />
            <path d="M50,45 Q20,25 24,55 Q50,65 50,45" fill="#e53935" opacity="0.9" />
            <path d="M50,45 Q80,25 76,55 Q50,65 50,45" fill="#e53935" opacity="0.9" />
            <path d="M50,45 Q30,75 50,75 Q70,75 50,45" fill="#c62828" opacity="0.95" />
            <path d="M50,45 Q25,15 50,22 Q75,15 50,45" fill="#ff5252" opacity="0.95" />
          </g>
          <circle cx="50" cy="45" r="8" fill="url(#sticker-poppy-center)" />
          <circle cx="50" cy="45" r="5" fill="none" stroke="#8bc34a" strokeWidth="1.5" />
          <line x1="50" y1="37" x2="50" y2="53" stroke="#8bc34a" strokeWidth="1" />
          <line x1="42" y1="45" x2="58" y2="45" stroke="#8bc34a" strokeWidth="1" />
        </svg>
      )
    },
    lavender: {
      name: 'LAVANDULA OPTICA',
      commonName: 'Spectrum Lavender',
      price: '3D',
      theme: '#7e57c2',
      badgeBg: '#d1c4e9',
      badgeText: '#512da8',
      svg: (
        <svg className="sticker-flower-svg sticker-sway" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="sticker-prism-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ab47bc" />
              <stop offset="100%" stopColor="#7e57c2" />
            </linearGradient>
            <linearGradient id="sticker-prism-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5c6bc0" />
              <stop offset="100%" stopColor="#26a69a" />
            </linearGradient>
          </defs>
          <path d="M50,25 Q48,60 50,95" stroke="#37474f" strokeWidth="2" fill="none" />
          <g>
            <polygon points="45,65 50,55 55,65 50,70" fill="url(#sticker-prism-blue)" />
            <polygon points="42,52 50,42 58,52 50,57" fill="url(#sticker-prism-cyan)" />
            <polygon points="48,53 50,47 52,53" fill="#ffffff" opacity="0.7" />
            <polygon points="44,38 50,28 56,38 50,43" fill="url(#sticker-prism-blue)" />
            <polygon points="47,26 50,16 53,26 50,30" fill="url(#sticker-prism-cyan)" />
            <path d="M49,75 Q35,70 42,85" stroke="#37474f" strokeWidth="1.5" fill="none" />
            <path d="M51,70 Q65,65 58,80" stroke="#37474f" strokeWidth="1.5" fill="none" />
          </g>
        </svg>
      )
    }
  }

  const flower = flowerData[selectedFlower] || flowerData.sunflower

  const handleStickerClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Smooth scroll down to the Seed Catalogue section on Channel Page
      const targetElement = document.querySelector('.timeline-section') || document.querySelector('.channel-card')
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  return (
    <div 
      className="sticker-outer-container"
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => { setIsHovered(true); setShowTooltip(true); }}
      onMouseLeave={() => { setIsHovered(false); setShowTooltip(false); }}
      onClick={handleStickerClick}
    >
      {/* Dynamic Style Injection for sticker-specific animations */}
      <style>{`
        .sticker-container {
          cursor: pointer;
          border-radius: 50%;
          background: #fdfcf9;
          border: 3.5px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.06), inset 0 2px 4px rgba(255,255,255,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
          position: relative;
          user-select: none;
        }

        .sticker-container.hovered {
          transform: scale(1.18) rotate(4deg);
          box-shadow: 0 8px 20px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06), inset 0 2px 4px rgba(255,255,255,1);
        }

        .sticker-flower-svg {
          width: 80%;
          height: 80%;
          transition: transform 0.3s ease;
        }

        .sticker-sway {
          animation: stickerSway 6s ease-in-out infinite;
        }

        .sticker-pulse {
          animation: stickerPulse 2.5s ease-in-out infinite;
        }

        @keyframes stickerSway {
          0%, 100% { transform: rotate(-4deg) scale(1); }
          50% { transform: rotate(4deg) scale(1.05); }
        }

        @keyframes stickerPulse {
          0%, 100% { transform: scale(0.96); }
          50% { transform: scale(1.04); }
        }

        .sticker-glitch-cyan {
          animation: stickerGlitch 0.5s steps(2) infinite;
        }
        .sticker-glitch-magenta {
          animation: stickerGlitch 0.5s steps(2) infinite reverse;
        }

        @keyframes stickerGlitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-0.8px, 0.8px); }
          40% { transform: translate(0.8px, -0.8px); }
          60% { transform: translate(-0.4px, -0.4px); }
          80% { transform: translate(0.4px, 0.4px); }
        }

        .sticker-price-badge {
          position: absolute;
          bottom: -2px;
          right: -6px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 800;
          font-size: 9px;
          padding: 1px 5px;
          border-radius: 6px;
          border: 1.5px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          letter-spacing: -0.5px;
          transform: rotate(6deg);
          z-index: 2;
        }

        .sticker-tooltip {
          position: absolute;
          bottom: 110%;
          left: 50%;
          transform: translateX(-50%) scale(0.9);
          background: #2b1400;
          color: #fdfcf9;
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          padding: 6px 10px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .sticker-tooltip.visible {
          opacity: 1;
          transform: translateX(-50%) scale(1);
        }

        .sticker-tooltip-arrow {
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #2b1400;
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
        }
      `}</style>

      {/* Main Sticker Frame */}
      <div 
        className={`sticker-container ${isHovered ? 'hovered' : ''}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {flower.svg}
        
        {/* Physical look: Price Tag / License Code Badge */}
        <div 
          className="sticker-price-badge"
          style={{ backgroundColor: flower.badgeBg, color: flower.badgeText }}
        >
          {flower.price}
        </div>
      </div>

      {/* Hover Info Tooltip */}
      <div className={`sticker-tooltip ${showTooltip ? 'visible' : ''}`}>
        <strong style={{ color: flower.theme, fontSize: '9px', letterSpacing: '0.5px' }}>{flower.name}</strong>
        <span style={{ fontSize: '10px' }}>Active Seed: {flower.commonName}</span>
        <span style={{ fontSize: '8px', opacity: 0.7, fontStyle: 'italic' }}>Click to view Seed Pack info</span>
        <div className="sticker-tooltip-arrow"></div>
      </div>
    </div>
  )
}
