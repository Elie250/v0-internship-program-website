import Image from 'next/image'
import { getPublishedEvents } from '@/lib/platform/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export async function EventsSection() {
  const events = await getPublishedEvents()

  if (!events.length) {
    return (
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#1e3a5f] text-white rounded-lg px-6 py-8 text-center">
            <h2 className="text-2xl font-bold">Past Events & Activities</h2>
            <p className="text-white/80 mt-2">Events will appear here once published by an administrator.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#1e3a5f] text-white rounded-t-lg px-6 py-4">
          <h2 className="text-2xl font-bold">Past Events & Activities</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              {event.image_url && (
                <div className="relative h-40">
                  <Image src={event.image_url} alt={event.title} fill className="object-cover" />
                </div>
              )}
              <CardHeader>
                <p className="text-xs uppercase text-muted-foreground">{event.event_type}</p>
                <CardTitle className="text-lg">{event.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>
                {event.start_date && (
                  <p className="text-xs mt-2 text-muted-foreground">
                    {new Date(event.start_date).toLocaleDateString()}
                    {event.location ? ` · ${event.location}` : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
