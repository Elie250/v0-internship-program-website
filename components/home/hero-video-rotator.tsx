'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { HeroVideoSlide } from '@/lib/media/hero-videos'
import { HERO_CLIP_SECONDS, heroVideoFilterForSlide } from '@/lib/media/hero-videos'

/** Incoming clip fades in on top; outgoing stays full brightness underneath. */
const CROSSFADE_MS = 1100
/** Load the next clip only shortly before transition — avoids mid-clip decoder contention on mobile. */
const PREWARM_BEFORE_END_S = 1.25

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

export function HeroVideoRotator({ playlist }: { playlist: HeroVideoSlide[] }) {
  const slides = playlist.length > 0 ? playlist : []
  const prefersReducedMotion = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0)
  const [crossfading, setCrossfading] = useState(false)
  const [outgoingLayer, setOutgoingLayer] = useState<0 | 1 | null>(null)
  const [incomingVisible, setIncomingVisible] = useState(false)
  const [initialReady, setInitialReady] = useState(false)

  const videoRefs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)]
  const slideByLayer = useRef<[number, number]>([-1, -1])
  const advancing = useRef(false)
  const crossfadeTimer = useRef<number | null>(null)
  const indexRef = useRef(0)
  const activeLayerRef = useRef<0 | 1>(0)

  indexRef.current = index
  activeLayerRef.current = activeLayer

  const inactiveLayer = (layer: 0 | 1): 0 | 1 => (layer === 0 ? 1 : 0)

  const clearCrossfadeTimer = useCallback(() => {
    if (crossfadeTimer.current) {
      window.clearTimeout(crossfadeTimer.current)
      crossfadeTimer.current = null
    }
  }, [])

  const unloadLayer = useCallback((layer: 0 | 1) => {
    const video = videoRefs[layer].current
    if (!video) return
    video.pause()
    video.removeAttribute('src')
    video.load()
    slideByLayer.current[layer] = -1
  }, [])

  const assignSlideToLayer = useCallback(
    (layer: 0 | 1, slideIndex: number) => {
      if (slideByLayer.current[layer] === slideIndex) return false

      const video = videoRefs[layer].current
      const slide = slides[slideIndex]
      if (!video || !slide) return false

      video.pause()
      video.preload = 'auto'
      video.src = slide.src
      video.load()
      slideByLayer.current[layer] = slideIndex
      return true
    },
    [slides]
  )

  const whenLayerBuffered = useCallback((layer: 0 | 1, onReady: () => void) => {
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
    const onLoadedData = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) finish()
    }

    video.addEventListener('canplaythrough', onCanPlayThrough, { once: true })
    video.addEventListener('loadeddata', onLoadedData, { once: true })

    const fallback = window.setTimeout(finish, 5000)

    return () => {
      window.clearTimeout(fallback)
      video.removeEventListener('canplaythrough', onCanPlayThrough)
      video.removeEventListener('loadeddata', onLoadedData)
    }
  }, [])

  const bufferLayer = useCallback(
    (layer: 0 | 1, slideIndex: number, onReady?: () => void) => {
      assignSlideToLayer(layer, slideIndex)
      return whenLayerBuffered(layer, onReady ?? (() => {}))
    },
    [assignSlideToLayer, whenLayerBuffered]
  )

  const playLayerFromStart = useCallback((layer: 0 | 1) => {
    const video = videoRefs[layer].current
    if (!video) return Promise.resolve()
    video.currentTime = 0
    return video.play().catch(() => {})
  }, [])

  const pauseLayer = useCallback((layer: 0 | 1) => {
    videoRefs[layer].current?.pause()
  }, [])

  const finishCrossfade = useCallback(
    (fromLayer: 0 | 1) => {
      pauseLayer(fromLayer)
      unloadLayer(fromLayer)
      setIncomingVisible(false)
      setCrossfading(false)
      setOutgoingLayer(null)
      advancing.current = false
    },
    [pauseLayer, unloadLayer]
  )

  const startCrossfade = useCallback(
    (fromLayer: 0 | 1, toLayer: 0 | 1, nextIndex: number) => {
      clearCrossfadeTimer()
      setIndex(nextIndex)
      setIncomingVisible(false)
      setOutgoingLayer(fromLayer)
      setActiveLayer(toLayer)
      setCrossfading(true)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIncomingVisible(true))
      })

      crossfadeTimer.current = window.setTimeout(() => {
        finishCrossfade(fromLayer)
      }, CROSSFADE_MS)
    },
    [clearCrossfadeTimer, finishCrossfade]
  )

  const goToNext = useCallback(() => {
    if (slides.length <= 1 || advancing.current || prefersReducedMotion) return
    advancing.current = true

    const currentLayer = activeLayerRef.current
    const nextIndex = (indexRef.current + 1) % slides.length
    const nextLayer = inactiveLayer(currentLayer)
    const nextVideo = videoRefs[nextLayer].current

    const runCrossfade = async () => {
      await playLayerFromStart(nextLayer)
      startCrossfade(currentLayer, nextLayer, nextIndex)
    }

    const isBuffered =
      slideByLayer.current[nextLayer] === nextIndex &&
      nextVideo != null &&
      nextVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA

    if (isBuffered) {
      void runCrossfade()
      return
    }

    bufferLayer(nextLayer, nextIndex, () => {
      void runCrossfade()
    })
  }, [bufferLayer, playLayerFromStart, prefersReducedMotion, slides.length, startCrossfade])

  useEffect(() => {
    if (!slides.length) return

    slideByLayer.current = [-1, -1]
    unloadLayer(1)

    const cleanup = bufferLayer(0, 0, () => {
      if (!prefersReducedMotion) void playLayerFromStart(0)
      setInitialReady(true)
    })
    return cleanup
  }, [bufferLayer, playLayerFromStart, prefersReducedMotion, slides, unloadLayer])

  useEffect(() => {
    if (
      !slides.length ||
      slides.length <= 1 ||
      prefersReducedMotion ||
      !initialReady ||
      crossfading
    ) {
      return
    }

    const layer = activeLayerRef.current
    const video = videoRefs[layer].current
    if (!video) return

    let clipAdvanced = false
    const advanceOnce = () => {
      if (clipAdvanced || advancing.current) return
      clipAdvanced = true
      goToNext()
    }

    const clipMs = HERO_CLIP_SECONDS * 1000
    const prewarmMs = Math.max(400, (HERO_CLIP_SECONDS - PREWARM_BEFORE_END_S) * 1000)

    const clipTimer = window.setTimeout(advanceOnce, clipMs)

    const prewarmTimer = window.setTimeout(() => {
      const nextLayer = inactiveLayer(activeLayerRef.current)
      const nextIndex = (indexRef.current + 1) % slides.length
      if (slideByLayer.current[nextLayer] === nextIndex) return
      bufferLayer(nextLayer, nextIndex)
    }, prewarmMs)

    const onError = () => window.setTimeout(advanceOnce, 1200)
    video.addEventListener('error', onError)

    return () => {
      window.clearTimeout(clipTimer)
      window.clearTimeout(prewarmTimer)
      video.removeEventListener('error', onError)
    }
  }, [activeLayer, bufferLayer, crossfading, goToNext, index, initialReady, prefersReducedMotion, slides.length])

  useEffect(() => () => clearCrossfadeTimer(), [clearCrossfadeTimer])

  if (!slides.length) {
    return <div className="absolute inset-0 bg-black" aria-hidden />
  }

  const currentSlide = slides[index]

  return (
    <div className="absolute inset-0 bg-black" aria-hidden>
      <div className="hero-video-stage absolute inset-0">
        {([0, 1] as const).map((layer) => {
          const isOutgoing = crossfading && outgoingLayer === layer
          const isIncoming = crossfading && activeLayer === layer
          const isVisible = !crossfading && activeLayer === layer

          let zClass = 'z-0'
          if (isOutgoing) zClass = 'z-[1]'
          else if (isIncoming) zClass = 'z-[2]'
          else if (isVisible) zClass = 'z-[1]'

          const show =
            isOutgoing || isVisible || (isIncoming && incomingVisible)

          const opacity = isIncoming ? (incomingVisible ? 1 : 0) : show ? 1 : 0

          const slideIndex = slideByLayer.current[layer]
          const layerSlide = slideIndex >= 0 ? slides[slideIndex] : undefined
          const filter = heroVideoFilterForSlide(layerSlide)

          return (
            <video
              key={layer}
              ref={videoRefs[layer]}
              muted
              playsInline
              autoPlay={layer === 0 && !prefersReducedMotion}
              preload={show || isIncoming ? 'auto' : 'none'}
              disablePictureInPicture
              data-hero-active={show ? 'true' : 'false'}
              aria-hidden={!show && !isIncoming}
              aria-label={show || isIncoming ? `Hero background: ${currentSlide?.label}` : undefined}
              className={`hero-video-layer absolute inset-0 h-full w-full object-cover object-center ${zClass}`}
              style={{
                opacity,
                visibility: show || isIncoming ? 'visible' : 'hidden',
                transition: isIncoming ? `opacity ${CROSSFADE_MS}ms ease-out` : 'none',
                filter: filter ?? 'none',
              }}
            />
          )
        })}
        {/* Steady grade — keeps perceived brightness even while clips and overlays stack */}
        <div className="hero-video-grade pointer-events-none absolute inset-0 z-[3]" aria-hidden />
      </div>

      {!prefersReducedMotion && slides.length > 1 ? (
        <div className="absolute bottom-20 sm:bottom-4 right-4 z-[4] flex items-center gap-2">
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
    </div>
  )
}
