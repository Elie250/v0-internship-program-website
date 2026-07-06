'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { HeroVideoSlide } from '@/lib/media/hero-videos'

const FALLBACK_POSTER = '/hero-laboratory.jpg'

export function HeroVideoRotator({ playlist }: { playlist: HeroVideoSlide[] }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [index, setIndex] = useState(0)
  const [videoReady, setVideoReady] = useState(false)

  const slides = playlist.length > 0 ? playlist : []
  const current = slides[index] ?? slides[0]

  const goToNext = useCallback(() => {
    if (slides.length <= 1) return
    setVideoReady(false)
    setIndex((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const playCurrent = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    void video.play().catch(() => {
      /* autoplay blocked — first frame still visible */
    })
  }, [])

  useEffect(() => {
    if (!current?.src) return

    setVideoReady(false)
    const video = videoRef.current
    if (!video) return

    const onCanPlay = () => {
      setVideoReady(true)
      playCurrent()
    }

    const onEnded = () => goToNext()

    const onError = () => {
      setVideoReady(false)
      window.setTimeout(goToNext, 4000)
    }

    video.addEventListener('canplay', onCanPlay)
    video.addEventListener('ended', onEnded)
    video.addEventListener('error', onError)
    video.load()

    return () => {
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('error', onError)
    }
  }, [current?.src, goToNext, playCurrent])

  if (!current) {
    return (
      <Image
        src={FALLBACK_POSTER}
        alt="Energy & Logics engineering training"
        fill
        className="absolute inset-0 object-cover object-center"
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
        className="absolute inset-0 object-cover object-center"
        priority
      />
      <video
        ref={videoRef}
        key={current.src}
        src={current.src}
        muted
        autoPlay
        playsInline
        preload="auto"
        aria-label={`Hero background: ${current.label}`}
        className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
          videoReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {slides.length > 1 ? (
        <div className="absolute bottom-20 sm:bottom-4 right-4 z-[2] flex items-center gap-2" aria-hidden>
          {slides.map((slide, slideIndex) => (
            <span
              key={slide.src}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                slideIndex === index ? 'w-8 bg-white' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      ) : null}
    </>
  )
}
