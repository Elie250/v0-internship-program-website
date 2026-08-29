'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { formatShopRwf } from '@/lib/shop/format'
import { type PublicCatalogueItem } from '@/lib/shop/public-catalogue'
import { cn } from '@/lib/utils'

const AUTOPLAY_MS = 3800

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function StorefrontHome({
  slides,
  className,
}: {
  slides?: PublicCatalogueItem[]
  className?: string
}) {
  const t = useShopT()
  const products = slides ?? []
  const canRotate = products.length > 1
  const [api, setApi] = useState<CarouselApi>()
  const [index, setIndex] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const paused = hovering || focused
  const current = products[index] ?? null
  const href = current ? `/product/${encodeURIComponent(current.slug)}` : '#products'

  const onSelect = useCallback((embla: CarouselApi) => {
    if (!embla) return
    setIndex(embla.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on('select', onSelect)
    api.on('reInit', onSelect)
    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api, onSelect])

  useEffect(() => {
    if (!api || !canRotate || paused || prefersReducedMotion()) return
    const id = window.setInterval(() => {
      api.scrollNext()
    }, AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [api, canRotate, paused])

  return (
    <section
      className={cn(
        'relative isolate h-[216px] w-full overflow-hidden rounded-[var(--shop-radius-lg)] bg-[#0E1F16] text-white lg:h-[50vh] lg:min-h-[240px]',
        className
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(false)
        }
      }}
    >
        {products.length > 0 ? (
          <Carousel
            setApi={setApi}
            opts={{ loop: canRotate, duration: 22, align: 'start' }}
            className="absolute inset-0 z-0 h-full w-full [&>[data-slot=carousel-content]]:h-full"
            tabIndex={canRotate ? 0 : undefined}
            aria-label={t('storefront.hero.carousel')}
          >
            <CarouselContent className="-ml-0 h-full">
              {products.map((product) => (
                <CarouselItem key={product.slug} className="h-full min-h-0 pl-0">
                  <div className="relative h-full w-full">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="absolute inset-y-0 right-0 h-full w-[78%] object-contain object-right"
                      />
                    ) : (
                      <div className="absolute inset-y-0 right-0 flex h-full w-[78%] items-center justify-center text-white/30">
                        <Package className="h-12 w-12" aria-hidden />
                      </div>
                    )}
                    <span className="sr-only">
                      {product.name} · {formatShopRwf(product.price)}
                    </span>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-y-0 right-0 flex h-full w-[78%] items-center justify-center text-white/30">
              <Package className="h-12 w-12" aria-hidden />
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
          <Image
            src="/shop-hero-fade.png"
            alt=""
            fill
            className="object-fill"
            unoptimized
          />
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-[56%] flex-col justify-center gap-1.5 py-5 pl-5 pr-2 sm:pl-6 lg:w-[50%] lg:gap-3 lg:py-8 lg:pl-8 lg:pr-4">
          <p className="sr-only">
            {t('brand.siteLabel')} · {t('storefront.arrivals.title')}
          </p>
          <h1 className="truncate text-xl font-bold leading-[24px] text-white lg:whitespace-normal lg:text-4xl lg:leading-10">
            {t('storefront.hero.title')}
          </h1>
          <p className="text-[22px] font-bold leading-[26px] text-[#1FA64A] lg:text-5xl lg:leading-none">
            {t('storefront.hero.emphasis')}
          </p>
          <p className="mt-0.5 text-[13px] leading-[18px] text-[#D1D5DB] lg:mt-1 lg:text-lg lg:leading-7">
            {t('storefront.hero.body')}
          </p>
          <Link
            href={href}
            className="pointer-events-auto mt-2 inline-flex h-10 w-fit items-center justify-center rounded-full bg-[#1FA64A] px-4 text-sm font-semibold text-white hover:bg-[#17863B] lg:mt-4 lg:h-12 lg:px-6 lg:text-base"
          >
            {t('storefront.hero.shopNow')}
          </Link>
        </div>

        {canRotate ? (
          <>
            <button
              type="button"
              className="absolute right-12 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#0E1F16]/40 text-white hover:bg-[#0E1F16]/70"
              onClick={() => api?.scrollPrev()}
              aria-label={t('storefront.hero.previous')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="absolute right-3 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#0E1F16]/40 text-white hover:bg-[#0E1F16]/70"
              onClick={() => api?.scrollNext()}
              aria-label={t('storefront.hero.next')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 right-4 z-10 flex gap-2">
              {products.map((product, slideIndex) => (
                <button
                  key={product.slug}
                  type="button"
                  className={cn(
                    'h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                    slideIndex === index ? 'w-5 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                  )}
                  aria-label={t('storefront.hero.goto', { n: slideIndex + 1 })}
                  aria-current={slideIndex === index ? 'true' : undefined}
                  onClick={() => api?.scrollTo(slideIndex)}
                />
              ))}
            </div>
          </>
        ) : null}
    </section>
  )
}
