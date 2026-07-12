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
    getPublishedAnnouncements(6),
    getPublishedWebinars(),
    getPublishedEvents(),
  ])

  const hasContent = announcements.length > 0 || webinars.length > 0 || events.length > 0
  if (!hasContent) return null

  return (
    <section id="happening" className="home-section home-section--white">
      <div className="max-w-6xl mx-auto">
        <HomeSectionHeader
          eyebrow="What's happening"
          title="News, webinars & events"
          description="Stay updated on workshops, enrollment windows, and community activities from Energy & Logics."
        />
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
