import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { HomeHeroSection } from '@/components/home/home-hero'
import { FounderSection } from '@/components/home/founder-section'
import { ExploreHubSection } from '@/components/home/explore-hub-section'
import { MissionSnippetSection } from '@/components/home/mission-snippet-section'
import { ProgrammesCoursesSection } from '@/components/home/programmes-courses-section'
import { ReadExploreSection } from '@/components/home/read-explore-section'
import { ToolsSection } from '@/components/home/tools-section'
import { ShopTeaserSection } from '@/components/home/shop-teaser-section'
import { ReviewsTrustSection } from '@/components/home/reviews-trust-section'
import { WhatsHappeningSection } from '@/components/home/whats-happening-section'
import { MembershipSection } from '@/components/home/membership-section'
import { HomeStickyNav } from '@/components/home/home-sticky-nav'
import { HomeSignedInStrip } from '@/components/home/home-signed-in-strip'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <HomeStickyNav />
      <div className="relative">
        <SiteHeader overlay />
        <HomeHeroSection fullViewport />
      </div>
      <HomeSignedInStrip />
      <ExploreHubSection />
      <MissionSnippetSection />
      <ProgrammesCoursesSection />
      <ReadExploreSection />
      <ReviewsTrustSection compact />
      <ToolsSection />
      <ShopTeaserSection />
      <WhatsHappeningSection />
      <MembershipSection />
      <FounderSection />
      <SiteFooter />
    </main>
  )
}
