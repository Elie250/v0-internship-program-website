import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { getActiveHero } from '@/lib/platform/queries'
import { HeroVideoRotator } from '@/components/home/hero-video-rotator'
import { HeroBackgroundMedia } from '@/components/home/hero-background-media'
import { getHeroVideoPlaylist } from '@/lib/media/hero-videos'
import { COMPANY } from '@/lib/company/constants'
import type { HeroContent } from '@/types/platform'

const HERO_POSTER = '/hero-laboratory.jpg'

const defaultHero: HeroContent = {
  id: 'default',
  title: `${COMPANY.brandName} — ${COMPANY.platformName}`,
  subtitle:
    'Hands-on engineering programmes in Kigali, a public Energy Library, and Field Notes from practitioners — learn, read, and build with East Africa\'s engineering community.',
  background_image: '/videos/playlist',
  cta_primary_label: 'View programmes',
  cta_primary_url: '/learning',
  cta_secondary_label: 'Explore Library',
  cta_secondary_url: '/library',
  is_active: true,
}

function useHeroVideoPlaylist(background: string | null | undefined): boolean {
  if (!background?.trim()) return true
  const value = background.trim()
  if (value === '/hero-laboratory.jpg') return true
  if (value === '/videos/playlist' || value === '/videos') return true
  return false
}

export async function HomeHeroSection({ fullViewport = false }: { fullViewport?: boolean }) {
  const hero = (await getActiveHero()) ?? defaultHero
  const showPlaylist = useHeroVideoPlaylist(hero.background_image)
  const videoPlaylist = getHeroVideoPlaylist()

  return (
    <section
      className={`relative flex items-end lg:items-center overflow-hidden bg-black ${
        fullViewport ? 'hero-viewport-full' : 'hero-viewport'
      }`}
    >
      {showPlaylist ? (
        <>
          <div className="absolute inset-0 md:hidden" aria-hidden>
            <Image
              src={HERO_POSTER}
              alt=""
              fill
              className="object-cover object-center"
              priority
            />
          </div>
          <div className="absolute inset-0 hidden md:block">
            <HeroVideoRotator playlist={videoPlaylist} />
          </div>
        </>
      ) : hero.background_image ? (
        <HeroBackgroundMedia src={hero.background_image} alt={hero.title} />
      ) : null}
      <div className="absolute inset-0 z-[1] bg-black/50 md:bg-black/40" aria-hidden />
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-8 pb-10 sm:pb-12 lg:pb-0 pt-24 sm:pt-28 lg:pt-[calc(var(--site-header-h)+2rem)]">
        <div className="max-w-2xl lg:max-w-3xl text-on-dark text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl font-bold mb-3 sm:mb-4 lg:mb-5 leading-[1.15] tracking-tight">
            {hero.title}
          </h1>
          {hero.subtitle && (
            <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 lg:mb-9 leading-relaxed max-w-2xl">
              {hero.subtitle}
            </p>
          )}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 sm:items-center">
            {hero.cta_primary_url && (
              <Link href={hero.cta_primary_url} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto min-w-[11rem] bg-white text-[var(--brand-navy)] hover:bg-white/90 font-semibold">
                  {hero.cta_primary_label ?? 'Browse programmes'}
                </Button>
              </Link>
            )}
            {hero.cta_secondary_url && (
              <Link href={hero.cta_secondary_url} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto min-w-[11rem] border-white text-white hover:bg-white/10 bg-transparent font-semibold"
                >
                  {hero.cta_secondary_label ?? 'Register'}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
