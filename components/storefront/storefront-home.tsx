'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'
import { StorefrontAvailability } from '@/components/storefront/storefront-add-to-cart'
import { formatShopRwf } from '@/lib/shop/format'
import {
  publicDiscountPercent,
  type PublicCatalogueItem,
} from '@/lib/shop/public-catalogue'
import { STOREFRONT_GUTTER } from '@/lib/shop/storefront-layout'
import { cn } from '@/lib/utils'

const AUTOPLAY_MS = 7000

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function StorefrontHome({ slides }: { slides?: PublicCatalogueItem[] }) {
  const t = useShopT()
  const products = slides ?? []
  const canRotate = products.length > 1
  const [api, setApi] = useState<CarouselApi>()
  const [index, setIndex] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const paused = hovering || focused

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

  if (products.length === 0) {
    return (
      <section className="relative overflow-hidden bg-[var(--brand-navy,#1e3a5f)] text-white">
        <div className={`relative ${STOREFRONT_GUTTER} py-12 sm:py-16`}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
            {t('storefront.hero.eyebrow')}
          </p>
          <p className="mt-2 text-sm font-medium text-amber-200">{t('brand.siteLabel')}</p>
          <h1 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {t('storefront.hero.title')}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
            {t('storefront.hero.body')}
          </p>
          <Button asChild className="mt-8 bg-white text-[var(--brand-navy,#1e3a5f)] hover:bg-white/90">
            <Link href="#products">{t('storefront.hero.browse')}</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section
      className="relative overflow-hidden bg-[var(--brand-navy-deep,#152a45)] text-white"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(false)
        }
      }}
    >
      <Carousel
        setApi={setApi}
        opts={{ loop: canRotate, duration: 22, align: 'start' }}
        className="w-full"
        tabIndex={canRotate ? 0 : undefined}
        aria-label={t('storefront.hero.carousel')}
      >
        <CarouselContent className="-ml-0">
          {products.map((product, slideIndex) => {
            const href = `/product/${encodeURIComponent(product.slug)}`
            const percent = publicDiscountPercent(product.listPrice, product.price)
            return (
              <CarouselItem key={product.slug} className="pl-0">
                <div className="relative h-[280px] overflow-hidden sm:h-[340px] md:h-[400px] lg:h-[460px]">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover object-center scale-125"
                      sizes="100vw"
                      priority={slideIndex === 0}
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[var(--brand-navy,#1e3a5f)]" />
                  )}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent md:bg-gradient-to-r md:from-slate-950/80 md:via-slate-950/35 md:to-transparent"
                    aria-hidden
                  />
                  <div className={`absolute inset-0 flex flex-col justify-end ${STOREFRONT_GUTTER} py-6 sm:py-8 lg:py-10`}>
                    <div className="max-w-xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                        {t('storefront.arrivals.title')}
                      </p>
                      <p className="mt-1 text-sm font-medium text-amber-200">{t('brand.siteLabel')}</p>
                      <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                        {product.name}
                      </h1>
                      <p className="mt-2 text-sm text-white/80">{product.sellingUnitLabel}</p>
                      <div className="mt-3 flex flex-wrap items-baseline gap-3">
                        <p className="text-2xl font-semibold sm:text-3xl">{formatShopRwf(product.price)}</p>
                        {product.listPrice ? (
                          <p className="text-sm text-white/60 line-through">
                            {formatShopRwf(product.listPrice)}
                          </p>
                        ) : null}
                        {percent ? (
                          <p className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-[var(--brand-navy,#1e3a5f)]">
                            −{percent}%
                          </p>
                        ) : null}
                      </div>
                      <div className="mt-2">
                        <StorefrontAvailability value={product.availability} onDark />
                      </div>
                      <p className="mt-3 max-w-md text-sm text-white/85">{t('storefront.hero.nowAt')}</p>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Button
                          asChild
                          className="bg-white text-[var(--brand-navy,#1e3a5f)] hover:bg-white/90"
                        >
                          <Link href={href}>{t('storefront.hero.viewProduct')}</Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                        >
                          <Link href="#products">{t('storefront.hero.browse')}</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>

        {canRotate ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute left-3 top-1/2 z-10 size-10 -translate-y-1/2 rounded-full border-white/40 bg-slate-950/40 text-white hover:bg-slate-950/60 hover:text-white sm:left-5"
              onClick={() => api?.scrollPrev()}
              aria-label={t('storefront.hero.previous')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-3 top-1/2 z-10 size-10 -translate-y-1/2 rounded-full border-white/40 bg-slate-950/40 text-white hover:bg-slate-950/60 hover:text-white sm:right-5"
              onClick={() => api?.scrollNext()}
              aria-label={t('storefront.hero.next')}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <div className="absolute bottom-4 right-4 z-10 flex gap-2 sm:bottom-6 sm:right-8">
              {products.map((product, slideIndex) => (
                <button
                  key={product.slug}
                  type="button"
                  className={cn(
                    'h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                    slideIndex === index ? 'w-6 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
                  )}
                  aria-label={t('storefront.hero.goto', { n: slideIndex + 1 })}
                  aria-current={slideIndex === index ? 'true' : undefined}
                  onClick={() => api?.scrollTo(slideIndex)}
                />
              ))}
            </div>
          </>
        ) : null}
      </Carousel>
    </section>
  )
}
