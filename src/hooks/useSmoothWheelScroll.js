import { useEffect, useRef } from 'react'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function normalizeDeltaY(event) {
  if (typeof event.deltaY === 'number' && event.deltaY !== 0) return event.deltaY
  if (typeof event.wheelDelta === 'number' && event.wheelDelta !== 0) return -event.wheelDelta / 3
  if (typeof event.detail === 'number' && event.detail !== 0) return event.detail * 16
  return 0
}

function canElementScroll(node, deltaY) {
  if (!(node instanceof HTMLElement)) return false

  const style = window.getComputedStyle(node)
  const overflowY = style.overflowY
  const scrollable = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'
  if (!scrollable) return false

  const maxScroll = node.scrollHeight - node.clientHeight
  if (maxScroll <= 0) return false

  if (deltaY > 0) return node.scrollTop < maxScroll
  if (deltaY < 0) return node.scrollTop > 0
  return false
}

function shouldAllowNestedScroll(target, container, deltaY) {
  let node = target

  while (node && node !== container) {
    if (canElementScroll(node, deltaY)) {
      return true
    }
    node = node.parentElement
  }

  return false
}

export default function useSmoothWheelScroll(containerRef, options = {}) {
  const {
    enabled = true,
    damping = 0.1,
    wheelMultiplier = 1.2,
    maxDelta = 220,
    usePageFallback = true,
  } = options
  const targetRef = useRef(0)
  const currentRef = useRef(0)
  const rafRef = useRef(null)
  const modeRef = useRef('window')

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return undefined
    }

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const element = containerRef?.current
    const pageScroller = document.scrollingElement || document.documentElement

    if (!pageScroller) {
      return undefined
    }

    const resolveMode = () => {
      if (!element || !usePageFallback) {
        return 'element'
      }

      const maxElementScroll = Math.max(0, element.scrollHeight - element.clientHeight)
      if (maxElementScroll > 0) {
        return 'element'
      }

      return 'window'
    }

    const getScroller = (mode) => (mode === 'element' ? element : pageScroller)

    const easedDamping = clamp(damping, 0.01, 1)
    const getScrollTop = (mode) => {
      if (mode === 'window') {
        return window.scrollY || pageScroller.scrollTop || 0
      }
      return element?.scrollTop || 0
    }

    const setScrollTop = (mode, value) => {
      if (mode === 'window') {
        window.scrollTo(0, value)
        return
      }
      if (element) {
        element.scrollTop = value
      }
    }

    const getMaxScroll = (mode) => {
      if (mode === 'window') {
        return Math.max(0, pageScroller.scrollHeight - window.innerHeight)
      }
      if (!element) {
        return 0
      }
      return Math.max(0, element.scrollHeight - element.clientHeight)
    }

    modeRef.current = resolveMode()
    targetRef.current = getScrollTop(modeRef.current)
    currentRef.current = getScrollTop(modeRef.current)

    const animate = () => {
      const distance = targetRef.current - currentRef.current
      if (Math.abs(distance) < 0.4) {
        currentRef.current = targetRef.current
        setScrollTop(modeRef.current, targetRef.current)
        rafRef.current = null
        return
      }

      currentRef.current += distance * easedDamping
      setScrollTop(modeRef.current, currentRef.current)
      rafRef.current = window.requestAnimationFrame(animate)
    }

    const startAnimation = () => {
      if (rafRef.current == null) {
        rafRef.current = window.requestAnimationFrame(animate)
      }
    }

    const onWheel = (event) => {
      if (event.defaultPrevented) return

      const deltaY = normalizeDeltaY(event)
      if (!deltaY) return

      const mode = resolveMode()
      modeRef.current = mode
      const scrollTarget = getScroller(mode)

      if (!scrollTarget) {
        return
      }

      if (mode === 'element' && element && !element.contains(event.target)) {
        return
      }

      if (mode === 'element' && shouldAllowNestedScroll(event.target, scrollTarget, deltaY)) {
        return
      }

      const maxScrollTop = getMaxScroll(mode)
      if (maxScrollTop <= 0) return

      const normalizedDelta = clamp(deltaY, -maxDelta, maxDelta) * wheelMultiplier
      if (!normalizedDelta) return

      event.preventDefault()
      targetRef.current = clamp(targetRef.current + normalizedDelta, 0, maxScrollTop)
      startAnimation()
    }

    const onScroll = () => {
      if (rafRef.current != null) return
      const top = getScrollTop(modeRef.current)
      targetRef.current = top
      currentRef.current = top
    }

    document.addEventListener('wheel', onWheel, { passive: false, capture: true })
    document.addEventListener('mousewheel', onWheel, { passive: false, capture: true })
    document.addEventListener('DOMMouseScroll', onWheel, { passive: false, capture: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    if (element) {
      element.addEventListener('scroll', onScroll, { passive: true })
    }

    return () => {
      document.removeEventListener('wheel', onWheel, true)
      document.removeEventListener('mousewheel', onWheel, true)
      document.removeEventListener('DOMMouseScroll', onWheel, true)
      window.removeEventListener('scroll', onScroll)
      if (element) {
        element.removeEventListener('scroll', onScroll)
      }
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
      }
      rafRef.current = null
    }
  }, [containerRef, enabled, damping, wheelMultiplier, maxDelta, usePageFallback])
}
