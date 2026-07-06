'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { CalendarClock, ClipboardList, ExternalLink, Radio, Video } from 'lucide-react'
import { getCurrentUser } from '@/app/actions/auth-service'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type CalendarEvent = {
  id: string
  type: 'session' | 'webinar' | 'quiz'
  title: string
  courseTitle?: string | null
  startsAt: string
  endsAt?: string | null
  meetingLink?: string | null
  href?: string | null
}

function eventIcon(type: CalendarEvent['type']) {
  if (type === 'webinar') return Radio
  if (type === 'quiz') return ClipboardList
  return Video
}

export default function StudentCalendarPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selected, setSelected] = useState<Date | undefined>(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUserName(
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Student'
      )
      const res = await fetch('/api/student/calendar', { credentials: 'same-origin' })
      const data = await res.json()
      if (res.ok) setEvents(data.events ?? [])
      setLoading(false)
    }
    void init()
  }, [router])

  const eventDays = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const key = new Date(e.startsAt).toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return map
  }, [events])

  const selectedEvents = selected
    ? eventDays.get(selected.toDateString()) ?? []
    : []

  const upcoming = events.slice(0, 8)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading calendar…</p>
      </div>
    )
  }

  return (
    <StudentPortalShell userName={userName}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-[var(--brand-navy)]" />
            My calendar
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Live classes, webinars, and quiz due dates across your programmes.
          </p>
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          <Card className="border-slate-200">
            <CardContent className="p-3 flex justify-center">
              <Calendar
                mode="single"
                selected={selected}
                onSelect={setSelected}
                modifiers={{
                  hasEvent: (date) => eventDays.has(date.toDateString()),
                }}
                modifiersClassNames={{
                  hasEvent: 'bg-[var(--brand-navy)]/15 font-semibold text-[var(--brand-navy)]',
                }}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-900">
                  {selected
                    ? selected.toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Select a day'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedEvents.length === 0 ? (
                  <p className="text-sm text-slate-600">No events on this day.</p>
                ) : (
                  selectedEvents.map((e) => {
                    const Icon = eventIcon(e.type)
                    return (
                      <div key={e.id} className="border border-slate-200 rounded-lg p-3 text-sm">
                        <div className="flex items-start gap-2">
                          <Icon className="h-4 w-4 mt-0.5 text-[var(--brand-navy)] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900">{e.title}</p>
                            {e.courseTitle ? (
                              <p className="text-xs text-slate-600">{e.courseTitle}</p>
                            ) : null}
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(e.startsAt).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {e.meetingLink ? (
                                <a
                                  href={e.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-medium text-[var(--brand-navy)] underline inline-flex items-center gap-1"
                                >
                                  Join <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : null}
                              {e.href ? (
                                <Link
                                  href={e.href}
                                  className="text-xs font-medium text-[var(--brand-navy)] underline"
                                >
                                  Open course
                                </Link>
                              ) : null}
                            </div>
                          </div>
                          <Badge
                            className={cn(
                              'text-[10px] shrink-0',
                              e.type === 'session'
                                ? 'bg-blue-100 text-blue-800'
                                : e.type === 'webinar'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-amber-100 text-amber-900'
                            )}
                          >
                            {e.type}
                          </Badge>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-900">Coming up</CardTitle>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-slate-600">No upcoming events in the next 90 days.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {upcoming.map((e) => (
                      <li key={e.id} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                        <span className="text-slate-800 truncate">{e.title}</span>
                        <span className="text-slate-500 text-xs shrink-0">
                          {new Date(e.startsAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StudentPortalShell>
  )
}
