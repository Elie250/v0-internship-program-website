import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { getActiveHero } from '@/lib/platform/queries'
import { COMPANY } from '@/lib/company/constants'
import type { HeroContent } from '@/types/platform'

const defaultHero: HeroContent = {
  id: 'default',
  title: `${COMPANY.brandName} — Engineering Training`,
  subtitle:
    'Hands-on programmes in embedded systems, industrial control, and advanced electrical technology. Based in Nyanza, Rwanda — training East African engineers for real industry work.',
  background_image: '/hero-laboratory.jpg',
  cta_primary_label: 'View Programmes',
  cta_primary_url: '/learning',
  cta_secondary_label: 'About Elie & our team',
  cta_secondary_url: '/about',
  is_active: true,
}

export async function HomeHeroSection() {
  const hero = (await getActiveHero()) ?? defaultHero

  return (
    <section className="relative min-h-[560px] md:min-h-[680px] lg:min-h-[760px] flex items-center overflow-hidden bg-[var(--brand-navy)]">
      {hero.background_image && (
        <Image
          src={hero.background_image}
          alt={hero.title}
          fill
          className="object-cover object-center scale-105 opacity-75"
          priority
        />
      )}
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-r from-[var(--brand-navy)]/95 via-[var(--brand-navy)]/80 to-[var(--brand-navy)]/35"
        aria-hidden
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 md:py-24 w-full">
        <div className="max-w-2xl text-on-dark">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">{hero.title}</h1>
          {hero.subtitle && (
            <p className="text-lg md:text-xl text-white/90 mb-8">{hero.subtitle}</p>
          )}
          <div className="flex flex-wrap gap-3">
            {hero.cta_primary_url && (
              <Link href={hero.cta_primary_url}>
                <Button size="lg" className="bg-white text-[#1e3a5f] hover:bg-white/90">
                  {hero.cta_primary_label ?? 'Get Started'}
                </Button>
              </Link>
            )}
            {hero.cta_secondary_url && (
              <Link href={hero.cta_secondary_url}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 bg-transparent">
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
