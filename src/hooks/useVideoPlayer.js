import { useState, useRef, useCallback, useEffect } from 'react'

/** Format seconds as M:SS. Returns '0:00' for invalid/NaN input. */
export function formatTime(sec) {
  const secNum = parseInt(Number(sec), 10)
  if (!Number.isFinite(secNum) || secNum < 0) return '0:00'
  const minutes = Math.floor(secNum / 60)
  const seconds = secNum - minutes * 60
  const pad = seconds < 10 ? '0' : ''
  return `${minutes}:${pad}${seconds}`
}

/** Keyboard key codes from original config */
const KEY = {
  play: [32, 75],
  back5: [37],
  skip5: [39],
  back10: [74],
  skip10: [76],
  theater: [84],
  full: [70],
  volUp: [38, 187],
  volDown: [40, 189],
  mute: [77],
  slower: [188],
  faster: [190],
  restart: [48, 36],
  end: [35],
  pct10: [49], pct20: [50], pct30: [51], pct40: [52], pct50: [53],
  pct60: [54], pct70: [55], pct80: [56], pct90: [57]
}

const SPEEDS = [2, 1.5, 1.25, 1, 0.5, 0.25]

/**
 * Custom hook that encapsulates all video player state and behavior from the original index.js.
 * No DOM or document.getElementById; all logic is via refs and state.
 */
export function useVideoPlayer({
  onGoTheater,
  onHideOverlays,
  themeColor = '#673AB7',
  theaterMode = false,
  sourceToken = '',
  disableNativePlayback = false,
}) {
  const playerRef = useRef(null)
  const playerBackgroundRef = useRef(null)
  const containerRef = useRef(null)
  const progressHolderRef = useRef(null)
  const fadeTimerRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [pending, setPending] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [progressPct, setProgressPct] = useState(0)
  const [bufferedPct, setBufferedPct] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [playbackRate, setPlaybackRateState] = useState(1)
  const [showControls, setShowControls] = useState(false)
  const [showSpeedPopup, setShowSpeedPopup] = useState(false)
  const [showCaptionsPopup, setShowCaptionsPopup] = useState(false)
  const [showQualityPopup, setShowQualityPopup] = useState(false)
  const [notice, setNotice] = useState('')
  const [progressHover, setProgressHover] = useState(false)
  const [scrubTime, setScrubTime] = useState(null)
  const [scrubPct, setScrubPct] = useState(0)
  const [playIcon, setPlayIcon] = useState('play_arrow')
  const [volumeIconDown, setVolumeIconDown] = useState('volume_down')
  const [speedActive, setSpeedActive] = useState(false)
  const [qualityActive, setQualityActive] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const beforeVolRef = useRef(1)
  const noticeTimeoutRef = useRef(null)
  const volumeRef = useRef(1)
  const playbackRateRef = useRef(1)
  const durationRef = useRef(0)

  const clearNoticeTimeout = useCallback(() => {
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current)
      noticeTimeoutRef.current = null
    }
  }, [])

  const queueNoticeClear = useCallback((ms = 500) => {
    clearNoticeTimeout()
    noticeTimeoutRef.current = setTimeout(() => {
      setNotice('')
      noticeTimeoutRef.current = null
    }, ms)
  }, [clearNoticeTimeout])

  // Keep refs in sync with state so keydown handler can read latest without effect re-subscribing
  useEffect(() => {
    volumeRef.current = volume
    playbackRateRef.current = playbackRate
    durationRef.current = duration
  }, [volume, playbackRate, duration])

  useEffect(() => {
    const p = playerRef.current
    const pb = playerBackgroundRef.current

    if (disableNativePlayback) {
      setPending(false)
      setIsLoading(false)
      setShowControls(false)
      setCurrentTime(0)
      setDuration(0)
      setProgressPct(0)
      setBufferedPct(0)
      setIsPlaying(false)
      return
    }

    try {
      p?.load?.()
      pb?.load?.()
    } catch {
      // ignore media reload issues
    }

    setPending(true)
    setIsLoading(true)
    setShowControls(false)
    setIsPlaying(false)
    setPlayIcon('play_arrow')
  }, [disableNativePlayback, sourceToken])

  const hidePopups = useCallback(() => {
    setShowSpeedPopup(false)
    setShowCaptionsPopup(false)
    setShowQualityPopup(false)
  }, [])

  const showNotice = useCallback((msg, stay = false) => {
    clearNoticeTimeout()
    setNotice(msg)
    if (!stay) {
      queueNoticeClear(500)
    }
  }, [clearNoticeTimeout, queueNoticeClear])

  // Clear notice timeout on unmount to avoid leaks
  useEffect(() => {
    return () => {
      clearNoticeTimeout()

      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current)
        fadeTimerRef.current = null
      }
    }
  }, [clearNoticeTimeout])

  const togglePlay = useCallback(() => {
    if (disableNativePlayback) return
    const p = playerRef.current
    const pb = playerBackgroundRef.current
    if (!p || !pb) return
    setPending(false)
    hidePopups()
    if (p.paused) {
      setShowControls(false)
      setPlayIcon('pause')
      p.play()
      pb.play()
      setNotice('play_arrow')
      queueNoticeClear(500)
      setIsPlaying(true)
    } else {
      setShowControls(true)
      setPlayIcon('play_arrow')
      p.pause()
      pb.pause()
      setNotice('pause')
      queueNoticeClear(500)
      setIsPlaying(false)
    }
  }, [disableNativePlayback, hidePopups, queueNoticeClear])

  const forcePlay = useCallback(() => {
    if (disableNativePlayback) return
    const p = playerRef.current
    const pb = playerBackgroundRef.current
    if (!p || !pb) return
    setPending(false)
    hidePopups()
    setShowControls(false)
    setPlayIcon('pause')
    p.play()
    pb.play()
    setIsPlaying(true)
  }, [disableNativePlayback, hidePopups])

  const jumpTo = useCallback((time) => {
    if (disableNativePlayback) return
    const p = playerRef.current
    const pb = playerBackgroundRef.current
    if (!p || !pb) return
    const t = Math.max(0, Math.min(time, duration || 0))
    p.currentTime = t
    pb.currentTime = t
    if (p.paused) {
      p.play()
      pb.play()
      setIsPlaying(true)
    }
  }, [disableNativePlayback, duration])

  const setVolume = useCallback((v) => {
    if (disableNativePlayback) return
    const vol = Math.max(0, Math.min(1, v))
    setVolumeState(vol)
    beforeVolRef.current = vol
    const p = playerRef.current
    if (p) p.volume = vol
    if (vol >= 1) setVolumeIconDown('volume_down')
    else if (vol <= 0.1) setVolumeIconDown('volume_mute')
    else setVolumeIconDown('volume_down')
  }, [disableNativePlayback])

  const setPlaybackRate = useCallback((rate) => {
    if (disableNativePlayback) return
    setPlaybackRateState(rate)
    const p = playerRef.current
    const pb = playerBackgroundRef.current
    if (p) p.playbackRate = rate
    if (pb) pb.playbackRate = rate
    setShowSpeedPopup(false)
    setSpeedActive(rate !== 1)
    showNotice(String(rate) + 'x')
  }, [disableNativePlayback, showNotice])

  const setQuality = useCallback((qual) => {
    setQualityActive(qual >= 720)
    setShowQualityPopup(false)
    hidePopups()
    showNotice(qual === 0 ? 'Auto' : `${qual}p`)
  }, [hidePopups, showNotice])

  const requestFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    hidePopups()
    onHideOverlays?.()
    if (document.fullscreenElement) {
      document.exitFullscreen?.()
    } else {
      el.requestFullscreen?.() || el.webkitRequestFullscreen?.() || el.msRequestFullscreen?.()
    }
  }, [hidePopups, onHideOverlays])

  const handleTheater = useCallback(() => {
    onHideOverlays?.()
    hidePopups()
    onGoTheater?.()
  }, [hidePopups, onGoTheater, onHideOverlays])

  const seekByClick = useCallback((e) => {
    if (disableNativePlayback) return
    const holder = progressHolderRef.current
    const p = playerRef.current
    const pb = playerBackgroundRef.current
    if (!holder || !p || !pb || !duration) return
    const rect = holder.getBoundingClientRect()
    if (!rect || rect.width <= 0) return
    const pos = e.clientX - rect.left - 7
    const prop = Math.max(0, Math.min(1, (pos + 1) / rect.width))
    const time = prop * duration
    const t = Math.max(0, Math.min(time, duration - 0.1))
    p.currentTime = t
    pb.currentTime = t
  }, [disableNativePlayback, duration])

  const handleProgressMove = useCallback((e) => {
    if (disableNativePlayback) return
    const holder = progressHolderRef.current
    const p = playerRef.current
    if (!holder || !p) return
    const rect = holder.getBoundingClientRect()
    if (!rect || rect.width <= 0) return
    const pos = e.clientX - rect.left - 7
    const prop = Math.max(0, Math.min(1, pos / rect.width))
    setScrubTime(prop * (p.duration || 0))
    setScrubPct(prop * 100)
    setProgressHover(true)
  }, [disableNativePlayback])

  const handleProgressLeave = useCallback(() => {
    setProgressHover(false)
    setScrubTime(null)
  }, [])

  // Loader and duration: bind to player element when ref is set
  useEffect(() => {
    if (disableNativePlayback) return
    const p = playerRef.current
    if (!p) return
    const onLoadStart = () => setIsLoading(true)
    const onCanPlay = () => setIsLoading(false)
    const onLoadedData = () => {
      const d = p.duration
      if (d && isFinite(d)) setDuration(d)
    }
    const onDurationChange = () => {
      const d = p.duration
      if (d && isFinite(d)) setDuration(d)
    }
    p.addEventListener('loadstart', onLoadStart)
    p.addEventListener('canplay', onCanPlay)
    p.addEventListener('loadeddata', onLoadedData)
    p.addEventListener('durationchange', onDurationChange)
    return () => {
      p.removeEventListener('loadstart', onLoadStart)
      p.removeEventListener('canplay', onCanPlay)
      p.removeEventListener('loadeddata', onLoadedData)
      p.removeEventListener('durationchange', onDurationChange)
    }
  }, [disableNativePlayback])

  // Update progress from video
  useEffect(() => {
    if (disableNativePlayback) return
    const p = playerRef.current
    if (!p) return
    const onTimeUpdate = () => {
      setCurrentTime(p.currentTime)
      if (p.duration && isFinite(p.duration)) {
        setProgressPct((p.currentTime / p.duration) * 100)
      }
    }
    const onProgress = () => {
      if (p.buffered.length > 0 && p.duration) {
        const end = p.buffered.end(p.buffered.length - 1)
        setBufferedPct((end / p.duration) * 100)
      }
    }
    const onEnded = () => {
      setPending(true)
      setPlayIcon('replay')
      setIsPlaying(false)
    }
    p.addEventListener('timeupdate', onTimeUpdate)
    p.addEventListener('progress', onProgress)
    p.addEventListener('ended', onEnded)
    return () => {
      p.removeEventListener('timeupdate', onTimeUpdate)
      p.removeEventListener('progress', onProgress)
      p.removeEventListener('ended', onEnded)
    }
  }, [disableNativePlayback])

  // Status check interval: progress and pointer-events when duration ready
  useEffect(() => {
    if (disableNativePlayback) return
    const id = setInterval(() => {
      const p = playerRef.current
      if (!p) return
      if (p.duration > 0) {
        setCurrentTime(p.currentTime)
        if (p.duration && isFinite(p.duration)) {
          setProgressPct((p.currentTime / p.duration) * 100)
        }
      }
      if (p.buffered.length > 0 && p.duration) {
        const end = p.buffered.end(p.buffered.length - 1)
        setBufferedPct((end / p.duration) * 100)
      }
    }, 500)
    return () => clearInterval(id)
  }, [disableNativePlayback])

  // Sync volume to video element when volume state changes
  useEffect(() => {
    if (disableNativePlayback) return
    const p = playerRef.current
    if (p) p.volume = volume
  }, [disableNativePlayback, volume])

  // Sync background video with main when in theater or fullscreen (from original syncCheck)
  useEffect(() => {
    if (disableNativePlayback) return
    const interval = setInterval(() => {
      const p = playerRef.current
      const pb = playerBackgroundRef.current
      const el = containerRef.current
      const full = Boolean(el && document.fullscreenElement === el)
      if ((theaterMode || full) && p && pb && p.duration) {
        const diff = Math.abs(pb.currentTime - p.currentTime)
        if (diff > 0.1) {
          p.currentTime = p.currentTime
          pb.currentTime = p.currentTime
        }
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [disableNativePlayback, theaterMode])

  // Controls visibility: show on move, hide after delay when playing
  const scheduleFade = useCallback(() => {
    if (disableNativePlayback) {
      setShowControls(false)
      return
    }

    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = null
    }

    if (!isPlaying) {
      fadeTimerRef.current = setTimeout(() => {
        setShowControls(false)
        fadeTimerRef.current = null
      }, 1000)
    } else {
      fadeTimerRef.current = setTimeout(() => {
        setShowControls(false)
        fadeTimerRef.current = null
      }, 2000)
    }
  }, [disableNativePlayback, isPlaying])

  const onContainerMouseMove = useCallback(() => {
    if (disableNativePlayback) return
    setShowControls(true)
    scheduleFade()
  }, [disableNativePlayback, scheduleFade])

  const onContainerMouseLeave = useCallback(() => {
    if (disableNativePlayback) return
    scheduleFade()
  }, [disableNativePlayback, scheduleFade])

  // Keyboard shortcuts (when no input/textarea focused). Use refs for volume/playbackRate/duration
  // so this effect only re-subscribes when callbacks change, not on every state tick.
  useEffect(() => {
    if (disableNativePlayback) return

    const handleKeyDown = (e) => {
      const active = document.activeElement
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
      if (isInput) return
      const key = e.which || e.keyCode
      const p = playerRef.current
      const pb = playerBackgroundRef.current
      if (!p || !pb) return
      const vol = volumeRef.current
      const rate = playbackRateRef.current
      const dur = durationRef.current || p.duration
      if (KEY.play.includes(key)) {
        e.preventDefault()
        togglePlay()
      } else if (KEY.back5.includes(key)) {
        jumpTo(p.currentTime - 5)
        showNotice('replay_5')
      } else if (KEY.skip5.includes(key)) {
        jumpTo(p.currentTime + 5)
        showNotice('forward_5')
      } else if (KEY.back10.includes(key)) {
        jumpTo(p.currentTime - 10)
        showNotice('replay_10')
      } else if (KEY.skip10.includes(key)) {
        jumpTo(p.currentTime + 10)
        showNotice('forward_10')
      } else if (KEY.theater.includes(key)) {
        handleTheater()
      } else if (KEY.full.includes(key)) {
        requestFullscreen()
      } else if (KEY.volUp.includes(key)) {
        setVolume(vol + 0.1)
      } else if (KEY.volDown.includes(key)) {
        setVolume(vol - 0.1)
      } else if (KEY.mute.includes(key)) {
        setVolume(vol > 0 ? 0 : beforeVolRef.current)
      } else if (KEY.restart.includes(key)) {
        jumpTo(0)
        showNotice('replay')
      } else if (KEY.end.includes(key)) {
        jumpTo((dur || p.duration) - 1)
        showNotice('skip_next')
      } else if (KEY.slower.includes(key)) {
        const idx = SPEEDS.indexOf(rate)
        const next = SPEEDS[Math.min(idx + 1, SPEEDS.length - 1)]
        setPlaybackRate(next)
      } else if (KEY.faster.includes(key)) {
        const idx = SPEEDS.indexOf(rate)
        const next = SPEEDS[Math.max(idx - 1, 0)]
        setPlaybackRate(next)
      } else if (key === 49) { jumpTo((dur || p.duration) * 0.1); showNotice('10%') }
      else if (key === 50) { jumpTo((dur || p.duration) * 0.2); showNotice('20%') }
      else if (key === 51) { jumpTo((dur || p.duration) * 0.3); showNotice('30%') }
      else if (key === 52) { jumpTo((dur || p.duration) * 0.4); showNotice('40%') }
      else if (key === 53) { jumpTo((dur || p.duration) * 0.5); showNotice('50%') }
      else if (key === 54) { jumpTo((dur || p.duration) * 0.6); showNotice('60%') }
      else if (key === 55) { jumpTo((dur || p.duration) * 0.7); showNotice('70%') }
      else if (key === 56) { jumpTo((dur || p.duration) * 0.8); showNotice('80%') }
      else if (key === 57) { jumpTo((dur || p.duration) * 0.9); showNotice('90%') }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disableNativePlayback, togglePlay, jumpTo, handleTheater, requestFullscreen, setVolume, setPlaybackRate, showNotice])

  return {
    refs: { playerRef, playerBackgroundRef, containerRef, progressHolderRef },
    state: {
      isPlaying,
      pending,
      currentTime,
      duration,
      progressPct,
      bufferedPct,
      volume,
      playbackRate,
      showControls,
      showSpeedPopup,
      showCaptionsPopup,
      showQualityPopup,
      notice,
      progressHover,
      scrubTime,
      scrubPct,
      playIcon,
      volumeIconDown,
      speedActive,
      qualityActive,
      themeColor,
      isLoading
    },
    actions: {
      togglePlay,
      forcePlay,
      jumpTo,
      setVolume,
      setPlaybackRate,
      setQuality,
      requestFullscreen,
      handleTheater,
      seekByClick,
      handleProgressMove,
      handleProgressLeave,
      hidePopups,
      showNotice,
      setShowSpeedPopup,
      setShowCaptionsPopup,
      setShowQualityPopup,
      onContainerMouseMove,
      onContainerMouseLeave,
      scheduleFade
    }
  }
}
