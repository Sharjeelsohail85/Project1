import React from 'react'

export default function HeartUploadLoader({
  progress = 0,
  title = 'Publishing Video...',
  subtitle = 'Please wait while we upload your video stream and apply privacy settings',
}) {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)))
  
  // Calculate stroke-dashoffset for circular ring (radius 60, circum ~377)
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference

  return (
    <div className="heart-upload-loader-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');

        .heart-upload-loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #31103f 100%);
          border-radius: 24px;
          border: 1px solid rgba(244, 114, 182, 0.25);
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          color: #ffffff;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          margin: 20px 0;
          position: relative;
          overflow: hidden;
          text-align: center;
        }

        /* Ambient glowing background blur */
        .heart-upload-bg-glow {
          position: absolute;
          width: 220px;
          height: 220px;
          background: radial-gradient(circle, rgba(244, 63, 94, 0.35) 0%, rgba(168, 85, 247, 0.15) 50%, transparent 70%);
          filter: blur(40px);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -60%);
          pointer-events: none;
          animation: heartGlowPulse 2.4s ease-in-out infinite alternate;
        }

        @keyframes heartGlowPulse {
          0% { transform: translate(-50%, -60%) scale(0.9); opacity: 0.6; }
          100% { transform: translate(-50%, -60%) scale(1.25); opacity: 0.9; }
        }

        .heart-svg-wrapper {
          position: relative;
          width: 160px;
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          z-index: 2;
        }

        .heart-beating-group {
          transform-origin: center center;
          animation: heartBeat 1.4s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }

        @keyframes heartBeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.12); }
          28% { transform: scale(1); }
          42% { transform: scale(1.08); }
          70% { transform: scale(1); }
        }

        /* Floating mini particle hearts */
        .floating-heart-particle {
          position: absolute;
          opacity: 0;
          pointer-events: none;
          animation: floatHeart 2.5s infinite ease-out;
        }

        .floating-heart-particle:nth-child(1) { left: 20%; animation-delay: 0.2s; font-size: 14px; }
        .floating-heart-particle:nth-child(2) { left: 40%; animation-delay: 0.9s; font-size: 18px; }
        .floating-heart-particle:nth-child(3) { left: 60%; animation-delay: 0.5s; font-size: 12px; }
        .floating-heart-particle:nth-child(4) { left: 80%; animation-delay: 1.4s; font-size: 16px; }

        @keyframes floatHeart {
          0% {
            transform: translateY(20px) scale(0.5) rotate(-10deg);
            opacity: 0;
          }
          30% {
            opacity: 0.9;
          }
          80% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-80px) scale(1.2) rotate(15deg);
            opacity: 0;
          }
        }

        .heart-loader-title {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.01em;
          background: linear-gradient(135deg, #ffffff 0%, #f472b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 6px;
          z-index: 2;
        }

        .heart-loader-subtitle {
          font-size: 13px;
          color: #94a3b8;
          max-width: 420px;
          line-height: 1.45;
          margin-bottom: 16px;
          z-index: 2;
        }

        .heart-progress-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: rgba(244, 63, 94, 0.15);
          border: 1px solid rgba(244, 63, 94, 0.4);
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
          color: #fb7185;
          backdrop-filter: blur(8px);
          z-index: 2;
        }

        .heart-pulse-dot {
          width: 8px;
          height: 8px;
          background-color: #f43f5e;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 10px #f43f5e;
          animation: dotBlink 1s infinite alternate;
        }

        @keyframes dotBlink {
          from { opacity: 0.3; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1.3); }
        }
      `}</style>

      {/* Floating mini hearts */}
      <div className="floating-heart-particle">💖</div>
      <div className="floating-heart-particle">💕</div>
      <div className="floating-heart-particle">💗</div>
      <div className="floating-heart-particle">💓</div>

      <div className="heart-upload-bg-glow"></div>

      <div className="heart-svg-wrapper">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <defs>
            {/* Gradient for progress ring */}
            <linearGradient id="heartRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="50%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>

            {/* Gradient for Heart Fill */}
            <linearGradient id="heartFillGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="70%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>

            {/* Linear gradient for liquid fill level based on progress */}
            <linearGradient id="liquidLevelGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset={`${safeProgress}%`} stopColor="#f43f5e" />
              <stop offset={`${safeProgress}%`} stopColor="rgba(255, 255, 255, 0.15)" />
            </linearGradient>

            {/* Drop shadow filter for heart */}
            <filter id="heartGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background track ring */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="6"
          />

          {/* Animated Progress Ring */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke="url(#heartRingGrad)"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 75 75)"
            style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
          />

          {/* Beating Heart Group */}
          <g className="heart-beating-group">
            {/* Outline Heart Base */}
            <path
              d="M75,108 C75,108 40,86 40,60 C40,46.7 50.7,36 64,36 C71.5,36 78.2,39.5 82.5,45 C86.8,39.5 93.5,36 101,36 C114.3,36 125,46.7 125,60 C125,86 75,108 75,108 Z"
              fill="rgba(30, 27, 75, 0.8)"
              stroke="rgba(244, 114, 182, 0.4)"
              strokeWidth="2.5"
            />

            {/* Liquid Fill Heart Path using percentage clip/gradient */}
            <path
              d="M75,108 C75,108 40,86 40,60 C40,46.7 50.7,36 64,36 C71.5,36 78.2,39.5 82.5,45 C86.8,39.5 93.5,36 101,36 C114.3,36 125,46.7 125,60 C125,86 75,108 75,108 Z"
              fill="url(#liquidLevelGrad)"
              filter="url(#heartGlowFilter)"
            />

            {/* Inner Shiny Highlight */}
            <path
              d="M48,56 C46,62 48,72 54,78"
              fill="none"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>

          {/* Centered Percentage text inside ring */}
          <text
            x="75"
            y="79"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="18"
            fontWeight="800"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}
          >
            {safeProgress}%
          </text>
        </svg>
      </div>

      <div className="heart-loader-title">{title}</div>
      <div className="heart-loader-subtitle">{subtitle}</div>

      <div className="heart-progress-badge">
        <span className="heart-pulse-dot"></span>
        <span>{safeProgress === 100 ? 'Finalizing Video...' : `${safeProgress}% Uploaded`}</span>
      </div>
    </div>
  )
}
