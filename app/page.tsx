import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { HomeHeroSection } from '@/components/home/home-hero'
import { FounderSection } from '@/components/home/founder-section'
import { ExploreHubSection } from '@/components/home/explore-hub-section'
import { ProgrammesCoursesSection } from '@/components/home/programmes-courses-section'
import { GamesTeaserSection } from '@/components/home/games-teaser-section'
import { ReadExploreSection } from '@/components/home/read-explore-section'
import { ShopTeaserSection } from '@/components/home/shop-teaser-section'
import { ReviewsTrustSection } from '@/components/home/reviews-trust-section'
import { WhatsHappeningSection } from '@/components/home/whats-happening-section'
import { MembershipSection } from '@/components/home/membership-section'
import { HomeStickyNav } from '@/components/home/home-sticky-nav'
import { HomeSignedInStrip } from '@/components/home/home-signed-in-strip'
import { SafeHomeSection } from '@/components/home/safe-home-section'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <HomeStickyNav />
      <div className="relative">
        <SiteHeader overlay />
        <SafeHomeSection label="hero">
          <HomeHeroSection fullViewport />
        </SafeHomeSection>
      </div>
      <SafeHomeSection label="signed-in">
        <HomeSignedInStrip />
      </SafeHomeSection>
      <ExploreHubSection />
      <SafeHomeSection label="programmes">
        <ProgrammesCoursesSection />
      </SafeHomeSection>
      <SafeHomeSection label="games">
        <GamesTeaserSection />
      </SafeHomeSection>
      <SafeHomeSection label="read">
        <ReadExploreSection />
      </SafeHomeSection>
      <SafeHomeSection label="reviews">
        <ReviewsTrustSection compact />
      </SafeHomeSection>
      <SafeHomeSection label="shop">
        <ShopTeaserSection />
      </SafeHomeSection>
      <SafeHomeSection label="happening">
        <WhatsHappeningSection />
      </SafeHomeSection>
      <SafeHomeSection label="membership">
        <MembershipSection />
      </SafeHomeSection>
      <SafeHomeSection label="founder">
        <FounderSection compact />
      </SafeHomeSection>
      <SafeHomeSection label="footer">
        <SiteFooter />
      </SafeHomeSection>
    </main>
  )
}
