'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { HERO_VIDEO_PLAYLIST } from '@/lib/media/hero-videos'

export function HeroVideoRotator() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(false)

  const current = HERO_VIDEO_PLAYLIST[index]

  const playCurrent = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    const attempt = video.play()
    if (attempt) {
      attempt.catch(() => {
        // Autoplay may be blocked until user interaction; video still advances on end when played.
      })
    }
  }, [])

  const handleEnded = useCallback(() => {
    setIndex((prev) => (prev + 1) % HERO_VIDEO_PLAYLIST.length)
  }, [])

  const handleError = useCallback(() => {
    setIndex((prev) => (prev + 1) % HERO_VIDEO_PLAYLIST.length)
  }, [])

  useEffect(() => {
    setReady(false)
    const video = videoRef.current
    if (!video) return

    const onCanPlay = () => {
      setReady(true)
      playCurrent()
    }

    video.addEventListener('canplay', onCanPlay, { once: true })
    video.load()

    return () => {
      video.removeEventListener('canplay', onCanPlay)
    }
  }, [current.src, playCurrent])

  return (
    <>
      <video
        ref={videoRef}
        key={current.src}
        src={current.src}
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
        onError={handleError}
        aria-label={`Hero background: ${current.label}`}
        className={`absolute inset-0 h-full w-full object-cover object-center scale-105 transition-opacity duration-700 ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="absolute bottom-4 right-4 z-[2] flex items-center gap-2" aria-hidden>
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
