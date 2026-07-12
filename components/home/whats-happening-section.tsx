import Link from 'next/link'
import {
  getPublishedAnnouncements,
  getPublishedEvents,
  getPublishedWebinars,
} from '@/lib/platform/queries'
import { WhatsHappeningPanel } from '@/components/home/whats-happening-panel'
import { HomeSectionHeader } from '@/components/home/home-section-header'

export async function WhatsHappeningSection() {
  const [announcements, webinars, events] = await Promise.all([
    getPublishedAnnouncements(3),
    getPublishedWebinars(),
    getPublishedEvents(),
  ])

  const hasContent = announcements.length > 0 || webinars.length > 0 || events.length > 0
  if (!hasContent) return null

  return (
    <section id="happening" className="home-section home-section--compact home-section--white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <HomeSectionHeader
            eyebrow="News & events"
            title="What&apos;s happening"
            align="left"
            className="mb-0"
          />
          <Link href="/career" className="text-sm font-medium text-[var(--brand-navy)] underline underline-offset-2 shrink-0">
            Career hub
          </Link>
        </div>
        <WhatsHappeningPanel
          announcements={announcements.map((item) => ({
            id: item.id,
            title: item.title,
            message: item.message,
            type: item.type,
            image_url: item.image_url,
          }))}
          webinars={webinars.map((w) => ({
            id: w.id,
            title: w.title,
            description: w.description,
            scheduled_at: w.scheduled_at,
            is_paid: w.is_paid,
            price: w.price,
            host_name: w.host_name,
          }))}
          events={events.map((event) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            event_type: event.event_type,
            image_url: event.image_url,
            start_date: event.start_date,
            location: event.location,
          }))}
        />
      </div>
    </section>
  )
}
