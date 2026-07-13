'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { HeroVideoSlide } from '@/lib/media/hero-videos'
import { HERO_CLIP_SECONDS } from '@/lib/media/hero-videos'

const CROSSFADE_MS = 900
/** Start the next clip slightly before the timer so crossfade overlaps playback. */
const CROSSFADE_OVERLAP_S = 0.45

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return reduced
}

function layerOpacity(
  layer: 0 | 1,
  activeLayer: 0 | 1,
  outgoingLayer: 0 | 1 | null,
  crossfading: boolean
): string {
  if (crossfading && outgoingLayer != null) {
    if (layer === activeLayer) return 'opacity-100 z-[2]'
    if (layer === outgoingLayer) return 'opacity-0 z-[1]'
    return 'opacity-0 z-0'
  }
  if (layer === activeLayer) return 'opacity-100 z-[1]'
  return 'opacity-0 z-0 pointer-events-none'
}

export function HeroVideoRotator({ playlist }: { playlist: HeroVideoSlide[] }) {
  const slides = playlist.length > 0 ? playlist : []
  const prefersReducedMotion = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0)
  const [crossfading, setCrossfading] = useState(false)
  const [outgoingLayer, setOutgoingLayer] = useState<0 | 1 | null>(null)
  const [initialReady, setInitialReady] = useState(false)

  const videoRefs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)]
  const slideByLayer = useRef<[number, number]>([-1, -1])
  const advancing = useRef(false)
  const indexRef = useRef(0)
  const activeLayerRef = useRef<0 | 1>(0)

  indexRef.current = index
  activeLayerRef.current = activeLayer

  const inactiveLayer = (layer: 0 | 1): 0 | 1 => (layer === 0 ? 1 : 0)

  const assignSlideToLayer = useCallback(
    (layer: 0 | 1, slideIndex: number) => {
      if (slideByLayer.current[layer] === slideIndex) return false

      const video = videoRefs[layer].current
      const slide = slides[slideIndex]
      if (!video || !slide) return false

      video.src = slide.src
      video.load()
      slideByLayer.current[layer] = slideIndex
      return true
    },
    [slides]
  )

  const whenLayerReady = useCallback((layer: 0 | 1, onReady: () => void) => {
    const video = videoRefs[layer].current
    if (!video) return () => {}

    let done = false
    const finish = () => {
      if (done) return
      done = true
      onReady()
    }

    if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      finish()
      return () => {}
    }

    const onCanPlayThrough = () => finish()
    const onCanPlay = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) finish()
    }

    video.addEventListener('canplaythrough', onCanPlayThrough, { once: true })
    video.addEventListener('canplay', onCanPlay, { once: true })

    const fallback = window.setTimeout(finish, 2500)

    return () => {
      window.clearTimeout(fallback)
      video.removeEventListener('canplaythrough', onCanPlayThrough)
      video.removeEventListener('canplay', onCanPlay)
    }
  }, [])

  const playLayer = useCallback((layer: 0 | 1, fromStart = true) => {
    const video = videoRefs[layer].current
    if (!video) return
    if (fromStart) video.currentTime = 0
    void video.play().catch(() => {})
  }, [])

  const pauseLayer = useCallback((layer: 0 | 1) => {
    videoRefs[layer].current?.pause()
  }, [])

  const prewarmLayer = useCallback(
    (layer: 0 | 1, slideIndex: number) => {
      assignSlideToLayer(layer, slideIndex)
      return whenLayerReady(layer, () => playLayer(layer, true))
    },
    [assignSlideToLayer, playLayer, whenLayerReady]
  )

  const startCrossfade = useCallback(
    (fromLayer: 0 | 1, toLayer: 0 | 1, nextIndex: number) => {
      setCrossfading(true)
      setOutgoingLayer(fromLayer)
      setActiveLayer(toLayer)
      setIndex(nextIndex)

      window.setTimeout(() => {
        pauseLayer(fromLayer)
        setCrossfading(false)
        setOutgoingLayer(null)
        advancing.current = false
      }, CROSSFADE_MS)
    },
    [pauseLayer]
  )

  const goToNext = useCallback(() => {
    if (slides.length <= 1 || advancing.current || prefersReducedMotion) return
    advancing.current = true

    const currentIndex = indexRef.current
    const currentLayer = activeLayerRef.current
    const nextIndex = (currentIndex + 1) % slides.length
    const nextLayer = inactiveLayer(currentLayer)
    const nextVideo = videoRefs[nextLayer].current

    const alreadyPrewarmed =
      slideByLayer.current[nextLayer] === nextIndex &&
      nextVideo != null &&
      nextVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA

    const runCrossfade = () => {
      playLayer(nextLayer, false)
      startCrossfade(currentLayer, nextLayer, nextIndex)
    }

    if (alreadyPrewarmed) {
      runCrossfade()
      return
    }

    assignSlideToLayer(nextLayer, nextIndex)
    whenLayerReady(nextLayer, runCrossfade)
  }, [
    assignSlideToLayer,
    playLayer,
    prefersReducedMotion,
    slides.length,
    startCrossfade,
    whenLayerReady,
  ])

  useEffect(() => {
    if (!slides.length) return

    slideByLayer.current = [-1, -1]
    assignSlideToLayer(0, 0)
    const cleanup = whenLayerReady(0, () => {
      if (!prefersReducedMotion) playLayer(0, true)
      setInitialReady(true)
    })
    return cleanup
  }, [assignSlideToLayer, playLayer, prefersReducedMotion, slides, whenLayerReady])

  useEffect(() => {
    if (!slides.length || slides.length <= 1 || prefersReducedMotion || !initialReady || crossfading) {
      return
    }

    const layer = inactiveLayer(activeLayerRef.current)
    const nextIndex = (indexRef.current + 1) % slides.length
    if (slideByLayer.current[layer] === nextIndex) {
      const video = videoRefs[layer].current
      if (video && video.paused && video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        playLayer(layer, true)
      }
      return
    }

    return prewarmLayer(layer, nextIndex)
  }, [activeLayer, crossfading, index, initialReady, playLayer, prewarmLayer, prefersReducedMotion, slides.length])

  useEffect(() => {
    if (!slides.length || prefersReducedMotion || !initialReady) return

    const layer = activeLayerRef.current
    const video = videoRefs[layer].current
    if (!video) return

    let clipAdvanced = false
    const advanceOnce = () => {
      if (clipAdvanced) return
      clipAdvanced = true
      goToNext()
    }

    const clipMs = Math.max(1500, (HERO_CLIP_SECONDS - CROSSFADE_OVERLAP_S) * 1000)
    const clipTimer = window.setTimeout(advanceOnce, clipMs)
    const onEnded = () => advanceOnce()
    const onError = () => window.setTimeout(advanceOnce, 800)

    video.addEventListener('ended', onEnded)
    video.addEventListener('error', onError)

    return () => {
      window.clearTimeout(clipTimer)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('error', onError)
    }
  }, [activeLayer, goToNext, index, initialReady, prefersReducedMotion, slides.length])

  if (!slides.length) {
    return <div className="absolute inset-0 bg-black" aria-hidden />
  }

  const currentSlide = slides[index]

  return (
    <>
      {([0, 1] as const).map((layer) => (
          <video
            key={layer}
            ref={videoRefs[layer]}
            muted
            playsInline
            autoPlay={layer === 0 && !prefersReducedMotion}
            preload="auto"
            disablePictureInPicture
            aria-hidden={layer !== activeLayer}
            aria-label={layer === activeLayer ? `Hero background: ${currentSlide?.label}` : undefined}
            className={`hero-video-layer absolute inset-0 h-full w-full object-cover object-center transition-opacity ease-in-out ${layerOpacity(
              layer,
              activeLayer,
              outgoingLayer,
              crossfading
            )}`}
            style={{ transitionDuration: `${CROSSFADE_MS}ms` }}
          />
        ))}

      {!prefersReducedMotion && slides.length > 1 ? (
        <div className="absolute bottom-20 sm:bottom-4 right-4 z-[3] flex items-center gap-2" aria-hidden>
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
