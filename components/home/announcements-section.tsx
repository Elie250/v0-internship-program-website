import Link from 'next/link'
import { getPublishedAnnouncements, getPublishedServices } from '@/lib/platform/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export async function AnnouncementsSection() {
  const announcements = await getPublishedAnnouncements(6)

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#1e3a5f] text-white rounded-t-lg px-6 py-4 mb-6">
          <h2 className="text-2xl font-bold">Public Announcements</h2>
        </div>
        {announcements.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Announcements will appear here once published by an administrator.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {announcements.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <p className="text-xs uppercase text-muted-foreground">{item.type ?? 'news'}</p>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export async function FeaturedServicesSection() {
  const services = await getPublishedServices()
  if (!services.length) return null

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#1e3a5f]">Featured Services</h2>
          <p className="text-muted-foreground mt-2">Admin-managed services across all portals</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <CardTitle>{service.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{service.category}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                {service.portal && (
                  <Link href={service.portal.startsWith('/') ? service.portal : `/${service.portal}`}>
                    <Button variant="outline" size="sm">Learn More</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
