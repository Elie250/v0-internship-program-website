import Link from 'next/link'
import { getPublishedWebinars } from '@/lib/platform/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Video, Calendar } from 'lucide-react'

export async function WebinarsSection() {
  const webinars = await getPublishedWebinars()

  if (!webinars.length) return null

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-on-dark bg-[var(--brand-navy)] rounded-t-lg px-6 py-4 flex items-center gap-2">
          <Video className="h-5 w-5 text-white" />
          <h2 className="text-2xl font-bold text-white">Upcoming Webinars</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
          {webinars.map((w) => (
            <Card key={w.id} className="overflow-hidden border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      w.is_paid ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {w.is_paid ? `${Number(w.price ?? 0).toLocaleString()} RWF` : 'Free'}
                  </span>
                  {w.host_name ? (
                    <span className="text-xs text-slate-600">Host: {w.host_name}</span>
                  ) : null}
                </div>
                <CardTitle className="text-lg text-slate-900">{w.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {w.description ? (
                  <p className="text-sm text-slate-600 line-clamp-3">{w.description}</p>
                ) : null}
                {w.scheduled_at ? (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(w.scheduled_at).toLocaleString()}
                  </p>
                ) : null}
                <Button asChild size="sm" variant="outline" className="text-slate-800">
                  <Link href="/auth/register">Register to attend</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
