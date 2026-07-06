import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { HomeHeroSection } from '@/components/home/home-hero'
import { FounderSection } from '@/components/home/founder-section'
import { TrainingProgramsSection } from '@/components/home/training-programs-section'
import { BrowseCoursesSection } from '@/components/home/browse-courses-section'
import { MembershipSection } from '@/components/home/membership-section'
import { PaymentCtaSection } from '@/components/home/payment-cta-section'
import { EventsSection } from '@/components/home/events-section'
import { WebinarsSection } from '@/components/home/webinars-section'
import { AnnouncementsSection, FeaturedServicesSection } from '@/components/home/announcements-section'
import { ReviewsTrustSection } from '@/components/home/reviews-trust-section'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <HomeHeroSection />
      <TrainingProgramsSection />
      <BrowseCoursesSection />
      <MembershipSection />
      <PaymentCtaSection />
      <WebinarsSection />
      <EventsSection />
      <AnnouncementsSection />
      <FeaturedServicesSection />
      <ReviewsTrustSection />
      <FounderSection />
      <SiteFooter />
    </main>
  )
}
