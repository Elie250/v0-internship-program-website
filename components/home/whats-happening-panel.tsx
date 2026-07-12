'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Calendar, Megaphone, Video } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AnnouncementItem = {
  id: string
  title: string
  message: string
  type?: string | null
  image_url?: string | null
}

type WebinarItem = {
  id: string
  title: string
  description?: string | null
  scheduled_at?: string | null
  is_paid?: boolean
  price?: number | null
  host_name?: string | null
}

type EventItem = {
  id: string
  title: string
  description?: string | null
  event_type?: string | null
  image_url?: string | null
  start_date?: string | null
  location?: string | null
}

type TabId = 'announcements' | 'webinars' | 'events'

export function WhatsHappeningPanel({
  announcements,
  webinars,
  events,
}: {
  announcements: AnnouncementItem[]
  webinars: WebinarItem[]
  events: EventItem[]
}) {
  const tabs = (
    [
      { id: 'announcements' as const, label: 'News', icon: Megaphone, count: announcements.length },
      { id: 'webinars' as const, label: 'Webinars', icon: Video, count: webinars.length },
      { id: 'events' as const, label: 'Events', icon: Calendar, count: events.length },
    ] satisfies { id: TabId; label: string; icon: typeof Megaphone; count: number }[]
  ).filter((tab) => tab.count > 0)

  const [active, setActive] = useState<TabId>(tabs[0]?.id ?? 'announcements')

  if (tabs.length === 0) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-center">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                'home-anchor-link inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                active === tab.id
                  ? 'bg-[var(--brand-navy)] text-white border-[var(--brand-navy)]'
                  : 'border-slate-300 text-slate-700 hover:border-slate-400 bg-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span className="text-xs opacity-80">({tab.count})</span>
            </button>
          )
        })}
      </div>

      {active === 'announcements' ? (
        <div className="grid md:grid-cols-2 gap-4">
          {announcements.slice(0, 2).map((item) => (
            <Card key={item.id} className="overflow-hidden border-slate-200">
              {item.image_url ? (
                <div className="relative h-36 w-full">
                  <Image src={item.image_url} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : null}
              <CardHeader className="pb-2">
                <p className="text-xs uppercase text-slate-500">{item.type ?? 'news'}</p>
                <CardTitle className="text-lg text-slate-900">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 line-clamp-3">{item.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {active === 'webinars' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {webinars.slice(0, 2).map((w) => (
            <Card key={w.id} className="border-slate-200">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap gap-2 mb-1">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      w.is_paid ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {w.is_paid ? `${Number(w.price ?? 0).toLocaleString()} RWF` : 'Free'}
                  </span>
                </div>
                <CardTitle className="text-lg text-slate-900">{w.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {w.description ? (
                  <p className="text-sm text-slate-600 line-clamp-3">{w.description}</p>
                ) : null}
                {w.scheduled_at ? (
                  <p className="text-xs text-slate-500">
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
      ) : null}

      {active === 'events' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.slice(0, 2).map((event) => (
            <Card key={event.id} className="overflow-hidden border-slate-200">
              {event.image_url ? (
                <div className="relative h-36">
                  <Image src={event.image_url} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : null}
              <CardHeader className="pb-2">
                <p className="text-xs uppercase text-slate-500">{event.event_type}</p>
                <CardTitle className="text-lg text-slate-900">{event.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 line-clamp-3">{event.description}</p>
                {event.start_date ? (
                  <p className="text-xs mt-2 text-slate-500">
                    {new Date(event.start_date).toLocaleDateString()}
                    {event.location ? ` · ${event.location}` : ''}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}
