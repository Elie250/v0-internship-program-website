'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { HeroVideoSlide } from '@/lib/media/hero-videos'
import { HERO_CLIP_SECONDS } from '@/lib/media/hero-videos'

/** Incoming clip fades in on top; outgoing stays full brightness underneath. */
const CROSSFADE_MS = 1100

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

  const assignSlideToLayer = useCallback(
    (layer: 0 | 1, slideIndex: number) => {
      if (slideByLayer.current[layer] === slideIndex) return false

      const video = videoRefs[layer].current
      const slide = slides[slideIndex]
      if (!video || !slide) return false

      video.pause()
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

    const fallback = window.setTimeout(finish, 4000)

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
    const video = videoRefs[layer].current
    if (!video) return
    video.pause()
    video.currentTime = 0
  }, [])

  const finishCrossfade = useCallback(
    (fromLayer: 0 | 1) => {
      pauseLayer(fromLayer)
      setIncomingVisible(false)
      setCrossfading(false)
      setOutgoingLayer(null)
      advancing.current = false
    },
    [pauseLayer]
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
    const cleanup = bufferLayer(0, 0, () => {
      if (!prefersReducedMotion) void playLayerFromStart(0)
      setInitialReady(true)
    })
    return cleanup
  }, [bufferLayer, playLayerFromStart, prefersReducedMotion, slides])

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

    const layer = inactiveLayer(activeLayerRef.current)
    const nextIndex = (indexRef.current + 1) % slides.length
    if (slideByLayer.current[layer] === nextIndex) return

    return bufferLayer(layer, nextIndex)
  }, [activeLayer, bufferLayer, crossfading, index, initialReady, prefersReducedMotion, slides.length])

  useEffect(() => {
    if (!slides.length || prefersReducedMotion || !initialReady || crossfading) return

    const layer = activeLayerRef.current
    const video = videoRefs[layer].current
    if (!video) return

    let clipAdvanced = false
    const advanceOnce = () => {
      if (clipAdvanced || advancing.current) return
      clipAdvanced = true
      goToNext()
    }

    const clipTimer = window.setTimeout(advanceOnce, HERO_CLIP_SECONDS * 1000)
    const onError = () => window.setTimeout(advanceOnce, 1200)

    video.addEventListener('error', onError)

    return () => {
      window.clearTimeout(clipTimer)
      video.removeEventListener('error', onError)
    }
  }, [activeLayer, crossfading, goToNext, index, initialReady, prefersReducedMotion, slides.length])

  useEffect(() => () => clearCrossfadeTimer(), [clearCrossfadeTimer])

  if (!slides.length) {
    return <div className="absolute inset-0 bg-black" aria-hidden />
  }

  const currentSlide = slides[index]

  return (
    <div className="absolute inset-0 bg-black" aria-hidden>
      {([0, 1] as const).map((layer) => {
        const isOutgoing = crossfading && outgoingLayer === layer
        const isIncoming = crossfading && activeLayer === layer
        const isVisible = !crossfading && activeLayer === layer

        let zClass = 'z-0'
        if (isOutgoing) zClass = 'z-[1]'
        else if (isIncoming) zClass = 'z-[2]'
        else if (isVisible) zClass = 'z-[1]'

        const opacity =
          isOutgoing || isVisible
            ? 1
            : isIncoming
              ? incomingVisible
                ? 1
                : 0
              : 0

        return (
          <video
            key={layer}
            ref={videoRefs[layer]}
            muted
            playsInline
            autoPlay={layer === 0 && !prefersReducedMotion}
            preload="auto"
            disablePictureInPicture
            aria-hidden={!isVisible && !isIncoming}
            aria-label={isVisible || isIncoming ? `Hero background: ${currentSlide?.label}` : undefined}
            className={`hero-video-layer absolute inset-0 h-full w-full object-cover object-center ${zClass}`}
            style={{
              opacity,
              transition: isIncoming ? `opacity ${CROSSFADE_MS}ms ease-out` : 'none',
            }}
          />
        )
      })}

      {!prefersReducedMotion && slides.length > 1 ? (
        <div className="absolute bottom-20 sm:bottom-4 right-4 z-[3] flex items-center gap-2">
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
