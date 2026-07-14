'use client'

import { useEffect, useState } from 'react'

/** True on coarse pointer or narrow viewport (phone-first controls). */
export function useTouchPlayLayout() {
  const [touchLayout, setTouchLayout] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px), (pointer: coarse)')
    const sync = () => setTouchLayout(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return touchLayout
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return reduced
}

/** Prevent page scroll while answering under time pressure. */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [locked])
}

type ShortcutOptions = {
  enabled: boolean
  onYes: () => void
  onNo: () => void
  onStart?: () => void
  onExit?: () => void
  onReplay?: () => void
}

/** Desktop: Y/→/1 Yes · N/←/2/0 No · Enter/Space start · Esc exit · R replay on result. */
export function useYesNoShortcuts({
  enabled,
  onYes,
  onNo,
  onStart,
  onExit,
  onReplay,
}: ShortcutOptions) {
  useEffect(() => {
    if (!enabled) return

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const key = e.key
      if (onExit && key === 'Escape') {
        e.preventDefault()
        onExit()
        return
      }
      if (onReplay && (key === 'r' || key === 'R')) {
        e.preventDefault()
        onReplay()
        return
      }
      if (onStart && (key === 'Enter' || key === ' ')) {
        e.preventDefault()
        onStart()
        return
      }

      if (key === 'y' || key === 'Y' || key === 'ArrowRight' || key === '1') {
        e.preventDefault()
        onYes()
        return
      }
      if (key === 'n' || key === 'N' || key === 'ArrowLeft' || key === '2' || key === '0') {
        e.preventDefault()
        onNo()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, onYes, onNo, onStart, onExit, onReplay])
}

export function feedbackPulse(wasCorrect: boolean) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(wasCorrect ? 12 : [18, 40, 18])
    }
  } catch {
    // Vibration is optional.
  }
}
