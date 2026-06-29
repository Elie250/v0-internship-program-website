import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCareerItems, getPublishedEvents } from '@/lib/platform/queries'

export default async function CareerPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string }>
}) {
  const params = await searchParams
  const module = params.module ?? 'guidance'
  const { webinars, workshops, mentorship } = await getCareerItems()
  const events = await getPublishedEvents(false)

  const modules = [
    { id: 'guidance', label: 'Career Guidance', description: 'Professional career development resources managed by administrators.' },
    { id: 'mentorship', label: 'Mentorship', items: mentorship },
    { id: 'workshops', label: 'Workshops', items: workshops },
    { id: 'webinars', label: 'Webinars', items: webinars },
    { id: 'events', label: 'Events', items: events },
  ]

  const active = modules.find((m) => m.id === module) ?? modules[0]

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="text-on-dark bg-[var(--brand-navy)] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Career Portal</h1>
          <p className="text-white/80">Career guidance, mentorship, workshops, webinars, and events.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {modules.map((m) => (
            <Link key={m.id} href={`/career?module=${m.id}`}>
              <Button variant={module === m.id ? 'default' : 'outline'}>{m.label}</Button>
            </Link>
          ))}
        </div>

        {active.id === 'guidance' ? (
          <Card>
            <CardHeader><CardTitle>Career Guidance</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground">
              <p>{active.description}</p>
              <Link href="/auth/register" className="inline-block mt-4"><Button>Register to Access Resources</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {(!active.items || active.items.length === 0) ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">No published {active.label.toLowerCase()} yet.</CardContent></Card>
            ) : (
              active.items.map((item: { id: string; title: string; description?: string | null; scheduled_at?: string | null; location?: string | null }) => (
                <Card key={item.id}>
                  <CardHeader><CardTitle>{item.title}</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    {item.scheduled_at && <p className="text-xs mt-2">{new Date(item.scheduled_at).toLocaleString()}</p>}
                    {item.location && <p className="text-xs">{item.location}</p>}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  )
}
