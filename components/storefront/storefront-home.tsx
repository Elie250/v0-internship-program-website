'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        'relative h-[216px] overflow-hidden rounded-[var(--shop-radius-lg)] bg-[var(--shop-hero)] text-white sm:h-[232px] md:h-[248px] lg:h-full lg:min-h-[360px]',
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
            className="h-full w-full"
            tabIndex={canRotate ? 0 : undefined}
            aria-label={t('storefront.hero.carousel')}
          >
            <CarouselContent className="-ml-0 h-full">
              {products.map((product, slideIndex) => (
                <CarouselItem key={product.slug} className="h-full pl-0">
                  <div className="relative h-full">
                    {product.image ? (
                      <div className="absolute inset-y-0 right-0 w-[78%]">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain object-right"
                          sizes="(min-width: 1024px) 36vw, 78vw"
                          priority={slideIndex === 0}
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-y-0 right-0 flex w-[78%] items-center justify-center text-white/30">
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
          <div className="relative h-full min-h-[216px]">
            <div className="absolute inset-y-0 right-0 flex w-[78%] items-center justify-center text-white/30">
              <Package className="h-12 w-12" aria-hidden />
            </div>
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0e1f16_0%,#0e1f16_34%,rgba(14,31,22,0.72)_46%,rgba(14,31,22,0.28)_68%,rgba(14,31,22,0)_86%)]"
          aria-hidden
        />

        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-[56%] flex-col justify-center gap-1.5 px-5 py-5 sm:px-6 lg:w-[52%] lg:px-7">
          <p className="sr-only">
            {t('brand.siteLabel')} · {t('storefront.arrivals.title')}
          </p>
          <h1 className="truncate text-xl font-bold leading-tight sm:text-[22px] lg:text-2xl">
            {t('storefront.hero.title')}
          </h1>
          <p className="text-xl font-bold leading-tight text-[var(--shop-green)] sm:text-[22px] lg:text-2xl">
            {t('storefront.hero.emphasis')}
          </p>
          <p className="mt-0.5 text-[13px] leading-[18px] text-[#D1D5DB] lg:text-sm lg:leading-6">
            {t('storefront.hero.body')}
          </p>
          <Button
            asChild
            className="pointer-events-auto mt-2 h-10 w-fit rounded-full bg-[var(--shop-green)] px-4 text-sm font-semibold text-white hover:bg-[var(--shop-green-pressed)]"
          >
            <Link href={href}>{t('storefront.hero.shopNow')}</Link>
          </Button>
        </div>

        {canRotate ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute left-3 top-1/2 z-10 size-9 -translate-y-1/2 rounded-full border-white/20 bg-[var(--shop-hero)]/40 text-white hover:bg-[var(--shop-hero)]/70 hover:text-white"
              onClick={() => api?.scrollPrev()}
              aria-label={t('storefront.hero.previous')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-3 top-1/2 z-10 size-9 -translate-y-1/2 rounded-full border-white/20 bg-[var(--shop-hero)]/40 text-white hover:bg-[var(--shop-hero)]/70 hover:text-white"
              onClick={() => api?.scrollNext()}
              aria-label={t('storefront.hero.next')}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
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
