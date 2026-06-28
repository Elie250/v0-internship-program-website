import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { getActiveHero } from '@/lib/platform/queries'
import type { HeroContent } from '@/types/platform'

const defaultHero: HeroContent = {
  id: 'default',
  title: 'Engineering Hub',
  subtitle: 'Engineering sustainable solutions through education, support, and innovation.',
  background_image: '/hero-laboratory.jpg',
  cta_primary_label: 'Explore Learning',
  cta_primary_url: '/learning',
  cta_secondary_label: 'Create Account',
  cta_secondary_url: '/auth/register',
  is_active: true,
}

export async function HomeHeroSection() {
  const hero = (await getActiveHero()) ?? defaultHero

  return (
    <section className="relative min-h-[420px] md:min-h-[520px] flex items-center overflow-hidden bg-[#1e3a5f]">
      {hero.background_image && (
        <Image
          src={hero.background_image}
          alt={hero.title}
          fill
          className="object-cover opacity-40"
          priority
        />
      )}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="max-w-2xl text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{hero.title}</h1>
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
