import { useState, useEffect } from 'react'

export default function SeedCatalogue({ videoCount = 0 }) {
  const [selectedFlower, setSelectedFlower] = useState('sunflower')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [channelInfo, setChannelInfo] = useState({
    createdMonth: 'October',
    createdYear: '2024',
    createdMonthIdx: 9,
    growthMonth: 'April',
    growthMonthIdx: 3,
    milestone: '1.3M subscribers',
    isFullyBloomed: true,
    subscriberCount: 1300000,
    target: 1000000,
    progress: 100,
    velocity: 15000,
    projectedYear: '2024'
  })

  // Load selection and calculate deterministic channel dates based on user_info
  useEffect(() => {
    // Load selected flower from localStorage
    const saved = localStorage.getItem('channel_seed_flower')
    if (saved) {
      setSelectedFlower(saved)
    }

    // Get user info to calculate stable, personalized creation & milestone dates
    const rawUser = localStorage.getItem('user_info')
    let user = null
    try {
      user = rawUser ? JSON.parse(rawUser) : null
    } catch (e) {
      console.error(e)
    }

    // Resolve actual subscriber count using candidate list
    let subscriberCount = 304
    if (user) {
      const candidates = [
        user.subscriber_count,
        user.subscriberCount,
        user.subscribers,
        user.followers,
        user.follower_count,
        user.followers_count,
        user.followersCount,
        user.stats?.subscriber_count,
        user.stats?.subscriberCount,
        user.stats?.subscribers,
        user.metrics?.subscriber_count,
        user.metrics?.subscriberCount,
        user.metrics?.subscribers,
        user.metrics?.followers,
      ]
      for (const cand of candidates) {
        if (typeof cand === 'number' && Number.isFinite(cand)) {
          subscriberCount = cand
          break
        }
        if (typeof cand === 'string') {
          const parsed = parseInt(cand.replace(/,/g, ''), 10)
          if (Number.isFinite(parsed)) {
            subscriberCount = parsed
            break
          }
        }
      }
    }

    // Determine if fully bloomed
    const isFullyBloomed = subscriberCount >= 1000000

    const email = user?.email || 'general.user@octopus.local'
    let hash = 0
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash)
    }

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const createdMonthIdx = Math.abs(hash) % 12
    const createdMonth = months[createdMonthIdx]
    const createdYear = String(2023 + (Math.abs(hash) % 3))

    let growthMonthIdx = (createdMonthIdx + 6) % 12
    let growthMonth = months[growthMonthIdx]
    let milestone = '1.3M subscribers'
    let target = 1000000
    let progress = 100
    let velocity = 15000
    let projectedYear = createdYear

    if (!isFullyBloomed) {
      // Pick target milestone
      if (subscriberCount < 1000) {
        target = 1000
        milestone = '1K subscribers'
      } else if (subscriberCount < 10000) {
        target = 10000
        milestone = '10K subscribers'
      } else if (subscriberCount < 100000) {
        target = 100000
        milestone = '100K subscribers'
      } else {
        target = 1000000
        milestone = '1M subscribers'
      }

      // Calculate organic & active velocity
      const baseVelocity = Math.max(8, (Math.abs(hash) % 12) + 6) // subs/month
      const contentSpeed = Math.max(12, (Math.abs(hash) % 20) + 10) // subs/month
      velocity = baseVelocity + (videoCount * contentSpeed)

      // Calculate months to bloom
      const remaining = target - subscriberCount
      const monthsToBloom = Math.ceil(remaining / velocity)

      // Calculate projected bloom date
      let projMonthIdx = (createdMonthIdx + monthsToBloom) % 12
      let projYear = parseInt(createdYear) + Math.floor((createdMonthIdx + monthsToBloom) / 12)

      // Ensure projection is in the future (July 2026 onwards)
      const currentYear = 2026
      const currentMonthIdx = 6 // July
      if (projYear < currentYear || (projYear === currentYear && projMonthIdx <= currentMonthIdx)) {
        // Adjust velocity organically or simulate future trajectory
        const adjustMonths = Math.max(3, (Math.abs(hash) % 8) + 2)
        projMonthIdx = (currentMonthIdx + adjustMonths) % 12
        projYear = currentYear + Math.floor((currentMonthIdx + adjustMonths) / 12)
      }

      growthMonthIdx = projMonthIdx
      growthMonth = months[projMonthIdx]
      projectedYear = String(projYear)
      progress = Math.min(100, Math.round((subscriberCount / target) * 100))
    }

    setChannelInfo({
      createdMonth,
      createdYear,
      createdMonthIdx,
      growthMonth,
      growthMonthIdx,
      milestone,
      isFullyBloomed,
      subscriberCount,
      target,
      progress,
      velocity,
      projectedYear
    })
  }, [videoCount])

  const handleSelectFlower = (flowerId) => {
    setSelectedFlower(flowerId)
    localStorage.setItem('channel_seed_flower', flowerId)
    setIsDrawerOpen(false)
  }

  // Define flower definitions
  const flowers = {
    sunflower: {
      id: 'sunflower',
      name: 'HELIANTHUS',
      commonName: 'Octopus Sunflower',
      price: '10¢',
      theme: '#e5a93b',
      description: 'A striking hybrid sunflower featuring bright golden-yellow petals that twist and sway like active tentacles under solar winds.',
      svg: (
        <svg className="flower-svg sway-animation" viewBox="0 0 100 100">
          <defs>
            <radialGradient id="sun-center" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4a2c0f" />
              <stop offset="70%" stopColor="#2b1400" />
              <stop offset="100%" stopColor="#1a0a00" />
            </radialGradient>
            <linearGradient id="tentacle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd54f" />
              <stop offset="60%" stopColor="#ffb300" />
              <stop offset="100%" stopColor="#f57c00" />
            </linearGradient>
          </defs>
          {/* Stem */}
          <path d="M50,55 Q52,85 48,95" stroke="#4e6e2f" strokeWidth="3" fill="none" />
          <path d="M50,75 Q35,70 42,62" stroke="#4e6e2f" strokeWidth="2.5" fill="none" />
          <path d="M42,62 Q35,62 38,70" fill="#5d8a38" />
          
          {/* Tentacle Petals */}
          <g className="petals-group">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
              <path
                key={i}
                d="M50,50 Q65,30 55,10 Q45,28 50,50"
                fill="url(#tentacle-grad)"
                transform={`rotate(${angle} 50 50)`}
                className="tentacle-petal"
                style={{ animationDelay: `${i * 0.25}s` }}
              />
            ))}
          </g>
          {/* Sunflower seed center */}
          <circle cx="50" cy="50" r="14" fill="url(#sun-center)" stroke="#ffb300" strokeWidth="1" />
          <circle cx="50" cy="50" r="10" fill="none" stroke="#e5a93b" strokeWidth="1.5" strokeDasharray="2,2" />
        </svg>
      )
    },
    rose: {
      id: 'rose',
      name: 'ROSA CYBERNETICA',
      commonName: 'Glitch Rose',
      price: '1/-',
      theme: '#d81b60',
      description: 'An elegant digital cultivar. Petals render in offset planes of cyan and magenta, shimmering with geometric beauty.',
      svg: (
        <svg className="flower-svg glitch-animation" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="rose-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#00838f" />
            </linearGradient>
            <linearGradient id="rose-magenta" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff007f" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#880e4f" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {/* Stem */}
          <path d="M50,52 Q47,80 53,95" stroke="#2d5a27" strokeWidth="3.5" fill="none" />
          <path d="M48,70 L40,65 L48,62 Z" fill="#2d5a27" />
          <path d="M51,78 L60,75 L52,70 Z" fill="#2d5a27" />

          {/* Glitch Offset petals */}
          <g className="glitch-offset-cyan" transform="translate(-1.5, 0.5)">
            <circle cx="50" cy="45" r="15" fill="none" stroke="url(#rose-cyan)" strokeWidth="2" />
            <path d="M50,22 C35,25 35,45 50,55 C65,45 65,25 50,22 Z" fill="url(#rose-cyan)" opacity="0.4" />
          </g>

          <g className="glitch-offset-magenta" transform="translate(1, -0.5)">
            {/* Outer Petals */}
            <path d="M50,20 C32,23 32,45 50,58 C68,45 68,23 50,20 Z" fill="url(#rose-magenta)" />
            {/* Middle Petals */}
            <path d="M50,26 C38,29 38,45 50,52 C62,45 62,29 50,26 Z" fill="#b71c1c" />
            {/* Inner Rose Bud */}
            <path d="M50,32 C43,34 43,45 50,48 C57,45 57,34 50,32 Z" fill="#ff4081" />
            <circle cx="50" cy="40" r="4" fill="#ffffff" opacity="0.8" />
          </g>
        </svg>
      )
    },
    poppy: {
      id: 'poppy',
      name: 'PAPAVER RUBEUS',
      commonName: 'Signal Poppy',
      price: '5¢',
      theme: '#e53935',
      description: 'A retro-inspired poppy with rich scarlet petals that expand in concentric acoustic rings, acting as a natural resonator.',
      svg: (
        <svg className="flower-svg pulse-animation" viewBox="0 0 100 100">
          <defs>
            <radialGradient id="poppy-center" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#111111" />
              <stop offset="80%" stopColor="#222222" />
              <stop offset="100%" stopColor="#050505" />
            </radialGradient>
          </defs>
          {/* Stem */}
          <path d="M50,50 L50,95" stroke="#388e3c" strokeWidth="2.5" strokeDasharray="1,1" fill="none" />
          
          {/* Concentric Signal Petals */}
          <g>
            {/* Outer Ring Petals */}
            <circle cx="50" cy="45" r="24" fill="none" stroke="#b71c1c" strokeWidth="1" strokeDasharray="3,3" />
            
            {/* Four main crimson petals */}
            <path d="M50,45 Q20,25 24,55 Q50,65 50,45" fill="#e53935" opacity="0.9" />
            <path d="M50,45 Q80,25 76,55 Q50,65 50,45" fill="#e53935" opacity="0.9" />
            <path d="M50,45 Q30,75 50,75 Q70,75 50,45" fill="#c62828" opacity="0.95" />
            <path d="M50,45 Q25,15 50,22 Q75,15 50,45" fill="#ff5252" opacity="0.95" />
          </g>

          {/* Central Transmitter Hub */}
          <circle cx="50" cy="45" r="8" fill="url(#poppy-center)" />
          <circle cx="50" cy="45" r="5" fill="none" stroke="#8bc34a" strokeWidth="1.5" />
          <line x1="50" y1="37" x2="50" y2="53" stroke="#8bc34a" strokeWidth="1" />
          <line x1="42" y1="45" x2="58" y2="45" stroke="#8bc34a" strokeWidth="1" />
        </svg>
      )
    },
    lavender: {
      id: 'lavender',
      name: 'LAVANDULA OPTICA',
      commonName: 'Spectrum Lavender',
      price: '3D',
      theme: '#7e57c2',
      description: 'A botanical miracle. Fine lavender stalks composed of tiny crystal prisms that separate and reflect purple, indigo, and violet spectrums.',
      svg: (
        <svg className="flower-svg sway-animation" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="prism-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ab47bc" />
              <stop offset="100%" stopColor="#7e57c2" />
            </linearGradient>
            <linearGradient id="prism-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5c6bc0" />
              <stop offset="100%" stopColor="#26a69a" />
            </linearGradient>
          </defs>
          {/* Main Stem */}
          <path d="M50,25 Q48,60 50,95" stroke="#37474f" strokeWidth="2" fill="none" />
          
          {/* Prismatic lavender buds */}
          <g>
            {/* Level 1 Bottom */}
            <polygon points="45,65 50,55 55,65 50,70" fill="url(#prism-blue)" />
            {/* Level 2 */}
            <polygon points="42,52 50,42 58,52 50,57" fill="url(#prism-cyan)" />
            <polygon points="48,53 50,47 52,53" fill="#ffffff" opacity="0.7" />
            {/* Level 3 */}
            <polygon points="44,38 50,28 56,38 50,43" fill="url(#prism-blue)" />
            {/* Level 4 Top */}
            <polygon points="47,26 50,16 53,26 50,30" fill="url(#prism-cyan)" />
            
            {/* Side Leaves */}
            <path d="M49,75 Q35,70 42,85" stroke="#37474f" strokeWidth="1.5" fill="none" />
            <path d="M51,70 Q65,65 58,80" stroke="#37474f" strokeWidth="1.5" fill="none" />
          </g>
        </svg>
      )
    }
  }

  const currentFlower = flowers[selectedFlower] || flowers.sunflower

  const monthsAbbr = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

  return (
    <div className="seed-catalogue-container">
      <style>{`
        .seed-catalogue-container {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        /* Vintage Seed Packet Card style */
        .vintage-seed-packet {
          position: relative;
          width: 100%;
          max-width: 380px;
          background-color: #f7f2e5;
          background-image: 
            radial-gradient(rgba(0,0,0,0.03) 1px, transparent 0),
            radial-gradient(rgba(0,0,0,0.02) 2px, transparent 0);
          background-size: 8px 8px;
          border: 3px double #5d4037;
          border-radius: 6px;
          padding: 16px;
          box-shadow: 0 8px 24px rgba(46, 33, 27, 0.15), inset 0 0 40px rgba(93, 64, 55, 0.05);
          color: #3e2723;
          font-family: 'Georgia', serif;
          user-select: none;
          box-sizing: border-box;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border-collapse: separate;
        }

        .vintage-seed-packet:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(46, 33, 27, 0.22);
        }

        /* Inner border ornamentation */
        .packet-inner-border {
          position: relative;
          border: 1px solid #c2b29e;
          padding: 12px;
          min-height: 420px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .corner-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          background-color: #5d4037;
          border-radius: 50%;
        }
        .corner-tl { top: -3px; left: -3px; }
        .corner-tr { top: -3px; right: -3px; }
        .corner-bl { bottom: -3px; left: -3px; }
        .corner-br { bottom: -3px; right: -3px; }

        /* Header typography */
        .packet-header {
          text-align: center;
          border-bottom: 1px dashed #c2b29e;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }

        .packet-brand {
          font-size: 10px;
          font-weight: bold;
          letter-spacing: 2px;
          color: #795548;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .packet-seal {
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 1px;
          color: #3e2723;
          text-transform: uppercase;
        }

        /* Price Circle */
        .price-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 36px;
          height: 36px;
          border: 2px dashed #d81b60;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          color: #d81b60;
          transform: rotate(8deg);
          background: #f7f2e5;
          z-index: 5;
        }

        /* Central Flower Art display */
        .flower-art-container {
          position: relative;
          width: 160px;
          height: 160px;
          margin: 12px auto;
          background: #fcfbfa;
          border: 1px solid #e7dfd1;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.04);
          overflow: hidden;
        }

        .flower-svg {
          width: 100%;
          height: 100%;
          transform-origin: bottom center;
        }

        /* Animations */
        @keyframes sway {
          0%, 100% { transform: rotate(-3deg) scaleY(0.98); }
          50% { transform: rotate(3deg) scaleY(1.02); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 1px rgba(229,57,53,0.3)); }
          50% { transform: scale(1.04); filter: drop-shadow(0 0 6px rgba(229,57,53,0.6)); }
        }

        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-1px, 1px); }
          40% { transform: translate(1px, -1px); }
          60% { transform: translate(-0.5px, -0.5px); }
          80% { transform: translate(0.5px, 0.5px); }
        }

        .sway-animation {
          animation: sway 5s ease-in-out infinite;
        }

        .pulse-animation {
          animation: pulse 3s ease-in-out infinite;
        }

        .glitch-animation:hover .glitch-offset-cyan {
          animation: glitch 0.4s steps(2) infinite;
        }
        .glitch-animation:hover .glitch-offset-magenta {
          animation: glitch 0.4s steps(2) infinite reverse;
        }

        /* Flower Labels */
        .flower-title-area {
          text-align: center;
          margin-bottom: 12px;
        }

        .latin-name {
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 1.5px;
          color: #3e2723;
          text-transform: uppercase;
          margin: 0;
        }

        .common-name {
          font-size: 11px;
          font-style: italic;
          color: #795548;
          margin-top: 2px;
        }

        /* Grid for Timeline months */
        .timeline-section {
          border-top: 1px dashed #c2b29e;
          padding-top: 10px;
          margin-top: 6px;
        }

        .timeline-title {
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #5d4037;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .months-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .month-node {
          position: relative;
          width: 18px;
          height: 18px;
          font-size: 8px;
          font-family: monospace;
          font-weight: bold;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8d6e63;
          border: 1px solid transparent;
        }

        /* Glow effects for Sow and Flower active indicators */
        .month-node.active-sow {
          background-color: #558b2f;
          color: #ffffff;
          box-shadow: 0 0 6px rgba(85,139,47,0.6);
          animation: sowPulse 2s infinite;
        }

        .month-node.active-flower {
          background-color: #d81b60;
          color: #ffffff;
          box-shadow: 0 0 6px rgba(216,27,96,0.6);
          animation: flowerPulse 2s infinite;
        }

        .month-node.active-projected {
          background-color: transparent;
          border: 2px dashed #0284c7;
          color: #0284c7;
          box-shadow: 0 0 8px rgba(2, 132, 199, 0.4);
          animation: projectedPulse 2.5s infinite;
        }

        @keyframes sowPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 2px rgba(85,139,47,0.4); }
          50% { transform: scale(1.15); box-shadow: 0 0 8px rgba(85,139,47,0.8); }
        }

        @keyframes flowerPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 2px rgba(216,27,96,0.4); }
          50% { transform: scale(1.15); box-shadow: 0 0 8px rgba(216,27,96,0.8); }
        }

        @keyframes projectedPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 2px rgba(2, 132, 199, 0.3); }
          50% { transform: scale(1.1); box-shadow: 0 0 10px rgba(2, 132, 199, 0.7); }
        }

        .timeline-desc {
          font-size: 10px;
          line-height: 1.3;
          color: #5d4037;
          background: rgba(255, 255, 255, 0.4);
          padding: 6px 8px;
          border-radius: 4px;
          border-left: 2px solid #c2b29e;
          margin-bottom: 6px;
        }

        .timeline-desc strong {
          color: #3e2723;
        }

        /* Change Button */
        .change-flower-btn {
          margin-top: 16px;
          background-color: #5d4037;
          color: #faf6eb;
          border: none;
          padding: 8px 16px;
          font-size: 12px;
          font-family: inherit;
          font-weight: bold;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .change-flower-btn:hover {
          background-color: #4e342e;
        }

        .change-flower-btn:active {
          transform: scale(0.97);
        }

        /* Wooden Drawer seed-catalogue selection styles */
        .catalogue-drawer {
          width: 100%;
          max-width: 440px;
          margin-top: 14px;
          background: #4e342e;
          border: 4px solid #3e2723;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3), inset 0 0 20px rgba(0,0,0,0.5);
          color: #efebe9;
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #5d4037;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }

        .drawer-title {
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 1px;
          color: #efebe9;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .drawer-close {
          background: transparent;
          border: none;
          color: #b0bec5;
          font-size: 18px;
          cursor: pointer;
          line-height: 1;
        }

        .drawer-close:hover {
          color: #ffffff;
        }

        .catalogue-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .catalogue-item {
          background: #5d4037;
          border: 1px solid #3e2723;
          border-radius: 6px;
          padding: 10px;
          cursor: pointer;
          transition: background-color 0.2s, border-color 0.2s, transform 0.15s;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .catalogue-item:hover {
          background: #6d4c41;
          border-color: #8d6e63;
          transform: scale(1.02);
        }

        .catalogue-item.active {
          background: #795548;
          border-color: #ffb300;
        }

        .item-preview-circle {
          width: 50px;
          height: 50px;
          background: #f7f2e5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 6px;
          overflow: hidden;
        }

        .item-name {
          font-size: 11px;
          font-weight: bold;
          color: #ffffff;
          margin-bottom: 2px;
          text-transform: uppercase;
        }

        .item-desc {
          font-size: 9px;
          color: #d7ccc8;
          line-height: 1.2;
        }
      `}</style>

      {/* Retro Seed Packet Card */}
      <div id="channelSeedPacket" className="vintage-seed-packet" role="figure" aria-label={`Seed Packet of ${currentFlower.commonName}`}>
        <div className="packet-inner-border">
          <span className="corner-dot corner-tl"></span>
          <span className="corner-dot corner-tr"></span>
          <span className="corner-dot corner-bl"></span>
          <span className="corner-dot corner-br"></span>

          <div className="price-badge">{currentFlower.price}</div>

          <div className="packet-header">
            <div className="packet-brand">Octopus seed catalogue</div>
            <div className="packet-seal">Finest Select Quality</div>
          </div>

          <div className="flower-art-container">
            {currentFlower.svg}
          </div>

          <div className="flower-title-area">
            <h4 className="latin-name">{currentFlower.name}</h4>
            <div className="common-name">{currentFlower.commonName}</div>
          </div>

          {/* SOW TIMELINE */}
          <div className="timeline-section" role="region" aria-label="Sow timetable">
            <div className="timeline-title">
              <span className="material-icons" style={{ fontSize: '10px', color: '#558b2f' }}>agriculture</span>
              Sow Month
            </div>
            <div className="months-grid">
              {monthsAbbr.map((m, idx) => (
                <div
                  key={`sow-${idx}`}
                  className={`month-node ${idx === channelInfo.createdMonthIdx ? 'active-sow' : ''}`}
                  title={idx === channelInfo.createdMonthIdx ? `Sown in ${channelInfo.createdMonth}` : m}
                >
                  {m}
                </div>
              ))}
            </div>
            <div className="timeline-desc">
              Sown in <strong>{channelInfo.createdMonth} {channelInfo.createdYear}</strong>. This represents the botanical moment this channel was established by the creator.
            </div>
          </div>

          {/* FLOWER TIMELINE */}
          <div className="timeline-section" role="region" aria-label="Flower timetable">
            <div className="timeline-title">
              <span className="material-icons" style={{ fontSize: '10px', color: channelInfo.isFullyBloomed ? '#d81b60' : '#0284c7' }}>
                {channelInfo.isFullyBloomed ? 'local_florist' : 'psychology'}
              </span>
              {channelInfo.isFullyBloomed ? 'Flower Month' : 'Projected Flower Month'}
            </div>
            <div className="months-grid">
              {monthsAbbr.map((m, idx) => (
                <div
                  key={`flower-${idx}`}
                  className={`month-node ${
                    idx === channelInfo.growthMonthIdx 
                      ? (channelInfo.isFullyBloomed ? 'active-flower' : 'active-projected') 
                      : ''
                  }`}
                  title={
                    idx === channelInfo.growthMonthIdx 
                      ? (channelInfo.isFullyBloomed ? `Flowers in ${channelInfo.growthMonth}` : `Projected to flower in ${channelInfo.growthMonth} ${channelInfo.projectedYear}`) 
                      : m
                  }
                >
                  {m}
                </div>
              ))}
            </div>
            <div className="timeline-desc">
              {channelInfo.isFullyBloomed ? (
                <>Blooms in <strong>{channelInfo.growthMonth}</strong>. This represents the month of peak growth when the channel reached its <strong>{channelInfo.milestone}</strong> milestone.</>
              ) : (
                <>
                  Projected to bloom in <strong>{channelInfo.growthMonth} {channelInfo.projectedYear}</strong>.
                  Based on your current <strong>{channelInfo.subscriberCount}</strong> subscribers, adding <strong>{videoCount}</strong> uploads acts as active fertilizer, boosting organic growth!
                </>
              )}
            </div>
            {/* PROGRESS BAR & VELOCITY FOR NEW CHANNELS */}
            {!channelInfo.isFullyBloomed && (
              <div className="bloom-progress-container" style={{ borderTop: '1px dashed #c2b29e', paddingTop: '8px', marginTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#5d4037', marginBottom: '4px' }}>
                  <span>Milestone Bloom Progress</span>
                  <span>{channelInfo.subscriberCount} / {channelInfo.target.toLocaleString()} ({channelInfo.progress}%)</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#e7dfd1', borderRadius: '3px', overflow: 'hidden', border: '1px solid #c2b29e', marginBottom: '4px' }}>
                  <div style={{ width: `${channelInfo.progress}%`, height: '100%', background: 'linear-gradient(90deg, #388e3c, #8bc34a)', borderRadius: '3px', transition: 'width 1s ease' }}></div>
                </div>
                <div style={{ fontSize: '9px', fontStyle: 'italic', color: '#795548', textAlign: 'center', marginTop: '2px' }}>
                  Growing at <strong>+{channelInfo.velocity} subs / month</strong>. Keep uploading to accelerate!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Button to open Catalogue Selector */}
      <button
        type="button"
        id="btnOpenCatalogue"
        className="change-flower-btn"
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        aria-expanded={isDrawerOpen}
        aria-controls="catalogueDrawer"
      >
        <span className="material-icons" style={{ fontSize: '14px' }}>auto_stories</span>
        {isDrawerOpen ? 'Close Catalogue' : 'Choose Flower from Catalogue'}
      </button>

      {/* Wooden Drawer Seed Catalogue Selection Grid */}
      {isDrawerOpen && (
        <div id="catalogueDrawer" className="catalogue-drawer" role="dialog" aria-label="Seed Catalogue">
          <div className="drawer-header">
            <div className="drawer-title">
              <span className="material-icons" style={{ color: '#ffb300', fontSize: '16px' }}>menu_book</span>
              Vintage Seed Catalogue
            </div>
            <button
              type="button"
              className="drawer-close"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          <div className="catalogue-grid">
            {Object.values(flowers).map((flower) => (
              <div
                key={flower.id}
                className={`catalogue-item ${selectedFlower === flower.id ? 'active' : ''}`}
                onClick={() => handleSelectFlower(flower.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSelectFlower(flower.id) }}
              >
                <div className="item-preview-circle">
                  <div style={{ width: '40px', height: '40px' }}>
                    {flower.svg}
                  </div>
                </div>
                <div className="item-name">{flower.commonName}</div>
                <div className="item-desc">{flower.description.slice(0, 52)}...</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
