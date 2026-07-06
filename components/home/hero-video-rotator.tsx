'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { HeroVideoSlide } from '@/lib/media/hero-videos'
import { HERO_CLIP_SECONDS } from '@/lib/media/hero-videos'

const FALLBACK_POSTER = '/hero-laboratory.jpg'

export function HeroVideoRotator({ playlist }: { playlist: HeroVideoSlide[] }) {
  const slides = playlist.length > 0 ? playlist : []
  const [index, setIndex] = useState(0)
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0)
  const [showPoster, setShowPoster] = useState(true)

  const videoRefs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)]
  const slideByLayer = useRef<[number, number]>([-1, -1])
  const advancing = useRef(false)
  const indexRef = useRef(0)
  const activeLayerRef = useRef<0 | 1>(0)

  indexRef.current = index
  activeLayerRef.current = activeLayer

  const inactiveLayer = (layer: 0 | 1): 0 | 1 => (layer === 0 ? 1 : 0)

  const pauseLayer = useCallback((layer: 0 | 1) => {
    videoRefs[layer].current?.pause()
  }, [])

  const assignSlideToLayer = useCallback(
    (layer: 0 | 1, slideIndex: number) => {
      if (slideByLayer.current[layer] === slideIndex) return

      const video = videoRefs[layer].current
      const slide = slides[slideIndex]
      if (!video || !slide) return

      video.src = slide.src
      video.load()
      slideByLayer.current[layer] = slideIndex
    },
    [slides]
  )

  const playLayer = useCallback((layer: 0 | 1) => {
    const video = videoRefs[layer].current
    if (!video) return
    video.currentTime = 0
    void video.play().catch(() => {})
  }, [])

  const whenLayerCanPlay = useCallback((layer: 0 | 1, onReady: () => void) => {
    const video = videoRefs[layer].current
    if (!video) return

    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      onReady()
      return
    }

    video.addEventListener('canplay', onReady, { once: true })
  }, [])

  const goToNext = useCallback(() => {
    if (slides.length <= 1 || advancing.current) return
    advancing.current = true

    const currentIndex = indexRef.current
    const currentLayer = activeLayerRef.current
    const nextIndex = (currentIndex + 1) % slides.length
    const nextLayer = inactiveLayer(currentLayer)

    assignSlideToLayer(nextLayer, nextIndex)

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.setTimeout(() => {
        advancing.current = false
      }, 700)
    }

    const failTimer = window.setTimeout(() => {
      if (settled) return
      settled = true
      advancing.current = false
      setIndex(nextIndex)
      setActiveLayer(nextLayer)
      setShowPoster(false)
    }, 12000)

    whenLayerCanPlay(nextLayer, () => {
      window.clearTimeout(failTimer)
      pauseLayer(currentLayer)
      playLayer(nextLayer)
      setActiveLayer(nextLayer)
      setIndex(nextIndex)
      setShowPoster(false)
      finish()
    })
  }, [assignSlideToLayer, pauseLayer, playLayer, slides.length, whenLayerCanPlay])

  useEffect(() => {
    if (!slides.length) return

    assignSlideToLayer(0, 0)

    whenLayerCanPlay(0, () => {
      playLayer(0)
      setShowPoster(false)
    })
  }, [assignSlideToLayer, playLayer, slides, whenLayerCanPlay])

  useEffect(() => {
    if (!slides.length) return

    const layer = activeLayerRef.current
    const video = videoRefs[layer].current
    if (!video) return

    let clipAdvanced = false
    const advanceOnce = () => {
      if (clipAdvanced) return
      clipAdvanced = true
      goToNext()
    }

    const clipTimer = window.setTimeout(advanceOnce, HERO_CLIP_SECONDS * 1000)
    const onEnded = () => advanceOnce()
    const onError = () => {
      window.setTimeout(advanceOnce, 1500)
    }

    video.addEventListener('ended', onEnded)
    video.addEventListener('error', onError)

    return () => {
      window.clearTimeout(clipTimer)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('error', onError)
    }
  }, [activeLayer, index, goToNext, slides.length])

  useEffect(() => {
    if (slides.length <= 1) return

    const layer = inactiveLayer(activeLayer)
    const nextIndex = (index + 1) % slides.length
    if (slideByLayer.current[layer] === nextIndex) return

    assignSlideToLayer(layer, nextIndex)
  }, [activeLayer, assignSlideToLayer, index, slides])

  useEffect(() => {
    pauseLayer(inactiveLayer(activeLayer))
  }, [activeLayer, pauseLayer])

  if (!slides.length) {
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

  const currentSlide = slides[index]

  return (
    <>
      {showPoster ? (
        <Image
          src={FALLBACK_POSTER}
          alt=""
          fill
          aria-hidden
          className="absolute inset-0 object-cover object-center"
          priority
        />
      ) : null}

      {([0, 1] as const).map((layer) => (
        <video
          key={layer}
          ref={videoRefs[layer]}
          muted
          playsInline
          preload="auto"
          aria-hidden={layer !== activeLayer}
          aria-label={layer === activeLayer ? `Hero background: ${currentSlide?.label}` : undefined}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
            layer === activeLayer && !showPoster ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

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
