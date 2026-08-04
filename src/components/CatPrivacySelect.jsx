import { useState, useRef, useEffect, useCallback } from 'react'

const OPTIONS = [
  {
    value: 'public',
    label: 'Public',
    icon: 'public',
    emoji: '🌐',
    badge: 'Everyone',
    description: 'Anyone on the web can find and watch this video.',
  },
  {
    value: 'unlisted',
    label: 'Unlisted',
    icon: 'link',
    emoji: '🔗',
    badge: 'Link Only',
    description: 'Anyone with the video link can watch it.',
  },
  {
    value: 'private',
    label: 'Private',
    icon: 'lock',
    emoji: '🔒',
    badge: 'Only You',
    description: 'Only you and chosen accounts can view this video.',
  },
]

export default function CatPrivacySelect({
  value = 'public',
  onChange,
  name = 'privacy',
  label = 'Video Privacy & Visibility',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMouseNear, setIsMouseNear] = useState(false)
  const [isMouseOverCat, setIsMouseOverCat] = useState(false)
  const [isSelectHovered, setIsSelectHovered] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const containerRef = useRef(null)

  const selectedOpt = OPTIONS.find((o) => o.value === value) || OPTIONS[0]

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        setHoveredIndex(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback(
    (val) => {
      setIsOpen(false)
      setHoveredIndex(null)
      if (onChange) {
        onChange({
          target: {
            name,
            value: val,
          },
        })
      }
    },
    [name, onChange]
  )

  const isAwakeLeft = isMouseNear || isMouseOverCat || isSelectHovered || isOpen || hoveredIndex !== null
  const isAwakeRight = isMouseOverCat || isSelectHovered || isOpen || hoveredIndex !== null
  const isLookingDown = isSelectHovered || isOpen || hoveredIndex !== null
  const isTailAssisting = isOpen || hoveredIndex !== null

  return (
    <div
      ref={containerRef}
      className="cat-privacy-select-root"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sour+Gummy:ital,wght@0,100..900;1,100..900&display=swap');

        .cat-privacy-select-root {
          position: relative;
          width: 100%;
          max-width: 540px;
          margin: 12px 0 16px 0;
          font-family: "Sour Gummy", cursive, system-ui, -apple-system, sans-serif;
          user-select: none;
        }

        .cat-mouse-detector {
          position: relative;
          padding: 34px 0 0 0;
          border-radius: 20px;
        }

        .cat-container-box {
          position: relative;
          width: 100%;
        }

        .cat-sleep-symbol {
          position: absolute;
          top: -30px;
          right: 68px;
          font-weight: 800;
          font-size: 18px;
          color: #fbbf24;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
          pointer-events: none;
          z-index: 10;
          display: flex;
          gap: 2px;
        }

        .cat-sleep-symbol span {
          display: inline-block;
          animation: catSleepAnim 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .cat-sleep-symbol span:nth-child(1) { animation-delay: 0s; font-size: 20px; }
        .cat-sleep-symbol span:nth-child(2) { animation-delay: 0.8s; font-size: 16px; margin-left: -4px; }
        .cat-sleep-symbol span:nth-child(3) { animation-delay: 1.6s; font-size: 13px; margin-left: -4px; }

        @keyframes catSleepAnim {
          0% { opacity: 0; transform: translateY(6px) scale(0.7); }
          50% { opacity: 1; transform: translateY(-8px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-20px) scale(0.8); }
        }

        .cat-thecat-wrapper {
          position: absolute;
          top: -46px;
          right: 28px;
          z-index: 5;
          pointer-events: none;
          width: 140px;
          height: 100px;
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
        }

        .cat-thecat-wrapper svg {
          width: 140px;
          height: 100px;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .cat-select-trigger {
          width: 100%;
          min-height: 56px;
          padding: 12px 18px;
          background: #ffffff;
          color: #0f172a;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
          transition: all 0.22s ease;
          position: relative;
          z-index: 2;
        }

        .cat-select-trigger:hover {
          background: #fef08a;
          border-color: #facc15;
          box-shadow: 0 6px 20px rgba(250, 204, 21, 0.3);
          transform: translateY(-1px);
        }

        .cat-select-trigger.is-open {
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
          background: #fef08a;
          border-color: #facc15;
        }

        .cat-dropdown-panel {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #ffffff;
          border: 2px solid #facc15;
          border-top: none;
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 16px;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
          z-index: 100;
          overflow: hidden;
          animation: catDropdownSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes catDropdownSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .cat-option-row {
          min-height: 54px;
          padding: 10px 14px 10px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          background: #ffffff;
          color: #0f172a;
          border-bottom: 1px solid #f1f5f9;
          transition: background-color 0.15s ease;
          position: relative;
        }

        .cat-option-row:last-child {
          border-bottom: none;
        }

        .cat-option-row:hover {
          background: #fef08a;
        }

        .cat-option-row.selected {
          font-weight: 700;
        }

        .cat-instructions-hint {
          margin-top: 8px;
          font-size: 13px;
          color: #fbbf24;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>

      {label && (
        <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
          {label}
        </div>
      )}

      <div
        className="cat-mouse-detector"
        onMouseEnter={() => setIsMouseNear(true)}
        onMouseLeave={() => setIsMouseNear(false)}
      >
        <div
          className="cat-container-box"
          onMouseEnter={() => setIsMouseOverCat(true)}
          onMouseLeave={() => setIsMouseOverCat(false)}
        >
          {!isAwakeLeft && (
            <div className="cat-sleep-symbol">
              <span>Z</span>
              <span>z</span>
              <span>z</span>
            </div>
          )}

          <div className="cat-thecat-wrapper">
            <svg
              width="45.952225mm"
              height="35.678726mm"
              viewBox="0 0 45.952225 35.678726"
              version="1.1"
              id="svg1"
              xmlSpace="preserve"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs id="defs1" />
              <g id="layer1" style={{ display: "inline" }} transform="translate(-121.80376,-101.90461)">
                <path style={{ display: "inline", fill: "#000000", stroke: "none", strokeWidth: "0.264583", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} d="m 144.95859,104.74193 c 6.01466,-2.1201 14.02915,-0.85215 17.62787,2.77812 3.59872,3.63027 2.91927,7.6226 -0.0661,11.80703 -2.98542,4.18443 -9.54667,3.58363 -15.1474,3.43959 -5.60073,-0.14404 -10.30411,-0.0586 -11.67474,-3.9026 7.85671,-2.22341 3.24576,-12.00205 9.26042,-14.12214 z" id="path1" />
                <path style={{ display: "inline", fill: "#000000", stroke: "none", strokeWidth: "0.264583", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} d="m 156.30732,121.30486 c 0,0 -3.82398,2.52741 -4.14054,3.7997 -0.31656,1.2723 0.31438,2.18109 0.95701,2.55128 0.64264,0.3702 1.59106,-0.085 2.13559,-0.75306 0.54452,-0.6681 1.5629,-2.25488 2.47945,-3.20579 0.91654,-0.95091 2.96407,-2.74361 2.96407,-2.74361 l 0.73711,-3.60348 z" id="path2" />
                <path style={{ display: "inline", fill: "#000000", stroke: "none", strokeWidth: "0.264583", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} d="m 136.93356,123.08347 c 0,0 -3.20149,3.2804 -3.24123,4.59088 -0.0397,1.31049 0.60411,1.83341 1.3106,2.05901 0.7065,0.22559 1.60304,-0.55255 1.99363,-1.32084 0.39056,-0.76832 1.14875,-2.30337 2.04139,-3.29463 0.89264,-0.99126 3.37363,-3.37561 3.37363,-3.37561 l -1.30007,-3.61169 z" id="path3" />
                <path style={{ display: "inline", fill: "#000000", stroke: "none", strokeWidth: "0.264583", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} d="m 130.12859,121.60522 c -2.15849,1.92962 -3.38576,3.23532 -3.61836,4.5256 -0.23257,1.2903 0.0956,1.80324 0.76105,2.13059 0.66549,0.32733 1.66701,-0.31006 2.16665,-1.01233 0.49961,-0.70231 1.04598,-1.14963 2.83575,-3.05671 1.78977,-1.90708 5.91823,-3.27102 5.91823,-3.27102 l -0.75313,-3.99546 c 0,0 -5.15171,2.7497 -7.31019,4.67933 z" id="path4" />
                <path id="path5" style={{ display: "inline", fill: "#000000", stroke: "none", strokeWidth: "0.292536", strokeLinecap: "round", strokeLinejoin: "round", strokeOpacity: "0.988235" }} d="m 147.59927,113.85404 c 0.68896,4.40837 -4.04042,7.93759 -10.51533,8.9455 -6.47491,1.00791 -12.24344,-0.88717 -12.9324,-5.29555 -0.68895,-4.40838 3.44199,-9.94186 9.9169,-10.94977 6.47491,-1.0079 12.84186,2.89144 13.53083,7.29982 z" />
                <path style={{ display: "inline", fill: "#000000", stroke: "none", strokeWidth: "0.264583", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} d="m 126.36446,111.82609 c 0,0 -2.37067,-6.28072 -0.86724,-7.10855 1.50342,-0.82783 5.87139,3.72617 5.87139,3.72617 z" id="path6" />
                <path style={{ display: "inline", fill: "#000000", stroke: "none", strokeWidth: "0.264583", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} d="m 143.50182,108.85407 c 0,0 -0.0544,-6.71302 -1.75519,-6.94283 -1.70081,-0.22982 -4.13211,5.59314 -4.13211,5.59314 z" id="path7" />
                <g id="g25" style={{ display: "inline" }}>
                  <path style={{ fill: "none", stroke: "#000000", strokeWidth: "0.529167", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} d="m 125.27102,116.06007 -2.97783,-1.05373" id="path8" />
                  <path style={{ fill: "none", stroke: "#000000", strokeWidth: "0.529167", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} d="m 124.91643,116.80991 -2.84808,0.0754" id="path9" />
                  <path style={{ fill: "none", stroke: "#000000", strokeWidth: "0.529167", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} d="m 124.97798,118.00308 -2.53111,0.5156" id="path10" />
                </g>
                <g id="g13" transform="rotate(-23.188815,49.755584,71.047761)" style={{ display: "inline", fill: "none", stroke: "#000000" }}>
                  <path style={{ fill: "none", stroke: "#000000", strokeWidth: "0.529167", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} d="m 121.77448,146.87682 3.00963,-0.95912" id="path11" />
                  <path style={{ fill: "none", stroke: "#000000", strokeWidth: "0.529167", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} d="m 122.10521,147.63749 2.84427,0.16537" id="path12" />
                  <path style={{ fill: "none", stroke: "#000000", strokeWidth: "0.529167", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} d="m 122.00599,148.82812 2.51354,0.59531" id="path13" />
                </g>
                <ellipse style={{ display: "inline", fill: "#ffffff", stroke: "none", strokeWidth: "0.56967", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} id="path14" cx="142.61723" cy="108.6707" rx="3.0261719" ry="3.0757811" transform="rotate(1.8105864)" />
                <ellipse style={{ display: "inline", fill: "#000000", stroke: "none", strokeWidth: "0.597086", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} id="ellipse15" cx="112.57543" cy="138.29808" rx="1.0380507" ry="1.3097118" transform="matrix(0.98048242,-0.19660678,0.20800608,0.97812753,0,0)" />
                <ellipse style={{ display: "inline", fill: "#f9f9f9", fillOpacity: "1", stroke: "none", strokeWidth: "0.184905", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} id="ellipse16" cx="112.70263" cy="137.817" rx="0.32146212" ry="0.40558979" transform="matrix(0.98048242,-0.19660678,0.20800608,0.97812753,0,0)" />
                <ellipse style={{ display: "inline", fill: "#ffffff", stroke: "none", strokeWidth: "0.56967", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} id="ellipse17" cx="135.40735" cy="110.12592" rx="3.0261719" ry="3.0757811" transform="rotate(1.8105864)" />
                <ellipse style={{ display: "inline", fill: "#000000", stroke: "none", strokeWidth: "0.597086", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} id="ellipse18" cx="105.22613" cy="138.07497" rx="1.0380507" ry="1.3097118" transform="matrix(0.98048242,-0.19660678,0.20800608,0.97812753,0,0)" />
                <ellipse style={{ display: "inline", fill: "#f9f9f9", fillOpacity: "1", stroke: "none", strokeWidth: "0.184905", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} id="ellipse19" cx="105.35332" cy="137.59389" rx="0.32146212" ry="0.40558979" transform="matrix(0.98048242,-0.19660678,0.20800608,0.97812753,0,0)" />
                
                <path
                  id="tail"
                  style={{ display: isTailAssisting ? "none" : "inline", fill: "#000000", stroke: "none" }}
                  d="m 163.77708,109.27292 c 4.36563,2.71198 4.26447,17.63497 3.70417,21.03437 -0.5603,3.3994 -1.86906,4.06275 -4.53099,4.49791 -5.87463,0.96037 -8.39724,-5.87134 -5.7547,-5.72161 2.64254,0.14973 3.15958,3.46446 5.95314,2.05052 2.79356,-1.41394 -1.42214,-13.46068 -1.42214,-13.46068 z"
                />
                <path style={{ display: "inline", fill: "#000000", stroke: "none", strokeWidth: "0.264583", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} d="m 159.74981,121.34445 c 0,0 -2.98896,3.47517 -2.94624,4.78555 0.0427,1.31039 0.89775,2.01247 1.61702,2.1932 0.71928,0.18075 1.50745,-0.51603 1.84897,-1.30735 0.34149,-0.79135 0.88811,-2.59584 1.51032,-3.76081 0.62219,-1.16497 2.10268,-3.44845 2.10268,-3.44845 l -0.27441,-3.66785 z" id="path20" />
                
                <g id="lefteyelid" style={{ display: isAwakeLeft ? "none" : "inline" }}>
                  <ellipse style={{ fill: "#000000", fillOpacity: "1", stroke: "none", strokeWidth: "0.529167", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} id="path21" cx="131.94429" cy="114.29948" rx="3.1571214" ry="3.2155864" />
                  <path style={{ fill: "#000000", fillOpacity: "1", stroke: "#ffffff", strokeWidth: "0.529167", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} d="m 129.32504,114.80228 c 2.54908,-1.14592 4.60706,-0.65481 4.60706,-0.65481" id="path22" />
                </g>
                <g id="righteyelid" style={{ display: isAwakeRight ? "none" : "inline" }}>
                  <ellipse style={{ fill: "#000000", fillOpacity: "1", stroke: "none", strokeWidth: "0.529167", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} id="ellipse22" cx="139.07704" cy="113.0834" rx="3.1571214" ry="3.2155864" />
                  <path style={{ fill: "#000000", fillOpacity: "1", stroke: "#ffffff", strokeWidth: "0.529167", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} d="m 136.48089,113.70683 c 2.48528,-1.2784 4.56624,-0.89621 4.56624,-0.89621" id="path23" />
                </g>
                <g id="eyesdown" style={{ display: isLookingDown ? "inline" : "none" }}>
                  <ellipse style={{ fill: "#ffffff", fillOpacity: "1", stroke: "none", strokeWidth: "0.529167", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} id="path26" cx="139.12122" cy="113.61373" rx="1.8686198" ry="2.0422525" />
                  <ellipse style={{ fill: "#000000", stroke: "none", strokeWidth: "0.597086", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} id="ellipse25" cx="112.24622" cy="139.77037" rx="1.0380507" ry="1.3097118" transform="matrix(0.98048242,-0.19660678,0.20800608,0.97812753,0,0)" />
                  <ellipse style={{ fill: "#f9f9f9", fillOpacity: "1", stroke: "none", strokeWidth: "0.184905", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} id="ellipse26" cx="112.37342" cy="139.28929" rx="0.32146212" ry="0.40558979" transform="matrix(0.98048242,-0.19660678,0.20800608,0.97812753,0,0)" />
                  <ellipse style={{ fill: "#ffffff", fillOpacity: "1", stroke: "none", strokeWidth: "0.529167", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} id="ellipse27" cx="131.994" cy="114.92011" rx="1.8686198" ry="2.0422525" />
                  <ellipse style={{ fill: "#000000", stroke: "none", strokeWidth: "0.597086", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} id="ellipse28" cx="105.00267" cy="139.64998" rx="1.0380507" ry="1.3097118" transform="matrix(0.98048242,-0.19660678,0.20800608,0.97812753,0,0)" />
                  <ellipse style={{ fill: "#f9f9f9", fillOpacity: "1", stroke: "none", strokeWidth: "0.184905", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "none", strokeOpacity: "0.988235" }} id="ellipse29" cx="105.12987" cy="139.1689" rx="0.32146212" ry="0.40558979" transform="matrix(0.98048242,-0.19660678,0.20800608,0.97812753,0,0)" />
                </g>
                <path
                  id="longtail"
                  style={{ display: isTailAssisting ? "inline" : "none", fill: "#000000", stroke: "none" }}
                  d="m 164.24062,110.09354 -2.10788,6.5381 c 0,0 0.84017,12.88397 0.35269,20.95169 h 4.78291 c 0.83489,-8.63528 0.13334,-24.78453 -3.02772,-27.48979 z"
                />
              </g>
            </svg>
          </div>

          <div
            className={`cat-select-trigger ${isOpen ? 'is-open' : ''}`}
            onMouseEnter={() => setIsSelectHovered(true)}
            onMouseLeave={() => setIsSelectHovered(false)}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>{selectedOpt.emoji}</span>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>{selectedOpt.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '12px',
                  background: '#2563eb',
                  color: '#ffffff',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                }}
              >
                {selectedOpt.badge}
              </span>
            </div>

            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▼
            </span>
          </div>

          {isOpen && (
            <div
              className="cat-dropdown-panel"
              onMouseEnter={() => setIsSelectHovered(true)}
              onMouseLeave={() => {
                setIsSelectHovered(false)
                setHoveredIndex(null)
              }}
            >
              {OPTIONS.map((opt, idx) => {
                const isSelected = opt.value === value
                const activeHoverIdx = hoveredIndex !== null ? hoveredIndex : 0
                const showTailPiece = idx < activeHoverIdx
                const showEndPiece = idx === activeHoverIdx

                return (
                  <div
                    key={opt.value}
                    className={`cat-option-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHoveredIndex(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{opt.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{opt.label}</div>
                        <div style={{ fontSize: '12px', fontWeight: 400, color: '#64748b' }}>
                          {opt.description}
                        </div>
                      </div>
                    </div>

                    <div style={{ width: '36px', height: '100%', position: 'absolute', right: '16px', top: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
                      <svg xmlSpace="preserve" width="24" height="100%" viewBox="0 0 13.226 12.7" preserveAspectRatio="none">
                        <g fill="#000000" fillOpacity="1" stroke="none" strokeLinecap="round" strokeLinejoin="round" strokeOpacity=".988" display="inline" transform="translate(-114.596 -144.523)">
                          <path
                            id="endpiece"
                            strokeWidth=".529"
                            d="M123.03 144.523c-.16 4.227-.609 7.58-1.632 7.915-2.976.975-2.985-2.38-5.574-2.928s-1.13 6.587 4.822 6.527c2.697-.027 4.356-.485 6.218-5.348.442-1.154.766-3.398.958-6.166z"
                            style={{ display: showEndPiece ? 'inline' : 'none' }}
                          />
                          <path
                            id="tailpiece"
                            strokeWidth=".753"
                            d="M123.041 144.523h4.781v12.7h-4.781z"
                            style={{ display: showTailPiece ? 'inline' : 'none' }}
                          />
                        </g>
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="cat-instructions-hint">
        <span>🐾 Approach sleeping cat with mouse or click menu to open options!</span>
      </div>

      <select
        name={name}
        value={value}
        onChange={(e) => handleSelect(e.target.value)}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
        tabIndex={-1}
        aria-hidden="true"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
