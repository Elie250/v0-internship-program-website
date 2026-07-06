'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { HERO_VIDEO_PLAYLIST } from '@/lib/media/hero-videos'

const FALLBACK_POSTER = '/hero-laboratory.jpg'
/** Minimum time each slide stays visible (ms) — avoids rapid black flashes when a file fails to load */
const MIN_SLIDE_MS = 15000

export function HeroVideoRotator() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const slideStartedAt = useRef(Date.now())
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [index, setIndex] = useState(0)
  const [videoVisible, setVideoVisible] = useState(false)
  const [allFailed, setAllFailed] = useState(false)
  const failCount = useRef(0)

  const current = HERO_VIDEO_PLAYLIST[index]

  const clearAdvanceTimer = () => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current)
      advanceTimer.current = null
    }
  }

  const goToNext = useCallback(() => {
    clearAdvanceTimer()
    setVideoVisible(false)
    setIndex((prev) => {
      const next = (prev + 1) % HERO_VIDEO_PLAYLIST.length
      if (next === 0 && failCount.current >= HERO_VIDEO_PLAYLIST.length) {
        setAllFailed(true)
        return prev
      }
      return next
    })
    slideStartedAt.current = Date.now()
  }, [])

  const scheduleAdvance = useCallback(
    (delayMs: number) => {
      clearAdvanceTimer()
      const elapsed = Date.now() - slideStartedAt.current
      const wait = Math.max(delayMs, MIN_SLIDE_MS - elapsed, 0)
      advanceTimer.current = setTimeout(goToNext, wait)
    },
    [goToNext]
  )

  const playCurrent = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    void video.play().then(() => {
      setVideoVisible(true)
    }).catch(() => {
      setVideoVisible(false)
    })
  }, [])

  useEffect(() => {
    if (allFailed) return

    setVideoVisible(false)
    slideStartedAt.current = Date.now()
    const video = videoRef.current
    if (!video) return

    const onLoadedData = () => {
      playCurrent()
    }

    const onPlaying = () => {
      setVideoVisible(true)
      failCount.current = 0
    }

    const onEnded = () => {
      scheduleAdvance(0)
    }

    const onError = () => {
      failCount.current += 1
      setVideoVisible(false)
      scheduleAdvance(MIN_SLIDE_MS)
    }

    video.addEventListener('loadeddata', onLoadedData)
    video.addEventListener('playing', onPlaying)
    video.addEventListener('ended', onEnded)
    video.addEventListener('error', onError)
    video.load()

    return () => {
      clearAdvanceTimer()
      video.removeEventListener('loadeddata', onLoadedData)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('error', onError)
    }
  }, [current.src, allFailed, playCurrent, scheduleAdvance])

  if (allFailed) {
    return (
      <Image
        src={FALLBACK_POSTER}
        alt="Energy & Logics engineering training"
        fill
        className="absolute inset-0 object-cover object-center scale-105"
        priority
      />
    )
  }

  return (
    <>
      <Image
        src={FALLBACK_POSTER}
        alt=""
        fill
        aria-hidden
        className="absolute inset-0 object-cover object-center scale-105"
        priority
      />
      <video
        ref={videoRef}
        key={current.src}
        muted
        autoPlay
        playsInline
        preload="auto"
        aria-label={`Hero background: ${current.label}`}
        className={`absolute inset-0 h-full w-full object-cover object-center scale-105 transition-opacity duration-1000 ${
          videoVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <source src={current.src} type={current.type} />
      </video>
      <div className="absolute bottom-20 sm:bottom-4 right-4 z-[2] flex items-center gap-2" aria-hidden>
        {HERO_VIDEO_PLAYLIST.map((slide, slideIndex) => (
          <span
            key={slide.src}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              slideIndex === index ? 'w-8 bg-white' : 'w-1.5 bg-white/40'
            }`}
          />
        ))}
      </div>
    </>
  )
}
