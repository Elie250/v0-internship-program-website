import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getActiveHero } from '@/lib/platform/queries'
import { HeroVideoRotator } from '@/components/home/hero-video-rotator'
import { HeroBackgroundMedia } from '@/components/home/hero-background-media'
import { getHeroVideoPlaylist } from '@/lib/media/hero-videos'
import { COMPANY } from '@/lib/company/constants'
import type { HeroContent } from '@/types/platform'

const defaultHero: HeroContent = {
  id: 'default',
  title: `${COMPANY.brandName} — Engineering Training`,
  subtitle:
    'Hands-on programmes in embedded systems, industrial control, and advanced electrical technology. Based in Kigali, Rwanda — training East African engineers for real industry work.',
  background_image: '/videos/playlist',
  cta_primary_label: 'View Programmes',
  cta_primary_url: '/learning',
  cta_secondary_label: 'About Elie & our team',
  cta_secondary_url: '/about',
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
      className={`relative flex items-end sm:items-center overflow-hidden bg-black ${
        fullViewport ? 'hero-viewport-full' : 'hero-viewport'
      }`}
    >
      {showPlaylist ? (
        <HeroVideoRotator playlist={videoPlaylist} />
      ) : hero.background_image ? (
        <HeroBackgroundMedia src={hero.background_image} alt={hero.title} />
      ) : null}
      <div className="absolute inset-0 z-[1] bg-black/40" aria-hidden />
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-10 pb-10 sm:pb-12 pt-24 sm:pt-28 lg:pt-32">
        <div className="max-w-2xl text-on-dark">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 leading-tight">{hero.title}</h1>
          {hero.subtitle && (
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed">{hero.subtitle}</p>
          )}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            {hero.cta_primary_url && (
              <Link href="#browse-courses" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-white text-[var(--brand-navy)] hover:bg-white/90">
                  {hero.cta_primary_label ?? 'Browse programmes'}
                </Button>
              </Link>
            )}
            {hero.cta_secondary_url && (
              <Link href={hero.cta_secondary_url} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10 bg-transparent">
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
