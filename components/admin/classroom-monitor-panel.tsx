'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, ExternalLink, MapPin, Video } from 'lucide-react'

type SessionRow = {
  id: string
  topic: string
  scheduledAt: string
  durationMinutes: number | null
  meetingLink: string | null
  location: string | null
  courseId: string
  courseTitle: string
  instructorName: string | null
  instructorEmail: string | null
}

function formatSessionTime(iso: string, durationMinutes: number | null) {
  const start = new Date(iso)
  const end =
    durationMinutes != null
      ? new Date(start.getTime() + durationMinutes * 60_000)
      : null
  const datePart = start.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const timePart = start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const endPart = end?.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return endPart ? `${datePart} · ${timePart} – ${endPart}` : `${datePart} · ${timePart}`
}

function SessionCard({ row }: { row: SessionRow }) {
  const isPast = new Date(row.scheduledAt) < new Date()

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{row.topic}</p>
            <p className="text-sm text-slate-700">{row.courseTitle}</p>
          </div>
          <Badge
            variant="outline"
            className={
              isPast
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }
          >
            {isPast ? 'Past' : 'Upcoming'}
          </Badge>
        </div>
        <p className="text-sm text-slate-800 flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
          {formatSessionTime(row.scheduledAt, row.durationMinutes)}
        </p>
        {row.instructorName ? (
          <p className="text-xs text-slate-600">
            Lecturer: <span className="text-slate-800 font-medium">{row.instructorName}</span>
          </p>
        ) : (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            No lecturer assigned to this programme
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {row.meetingLink ? (
            <Button asChild size="sm" variant="outline" className="border-slate-300 text-slate-800">
              <a href={row.meetingLink} target="_blank" rel="noopener noreferrer">
                <Video className="h-3.5 w-3.5 mr-1" /> Join link
              </a>
            </Button>
          ) : null}
          {row.location ? (
            <span className="inline-flex items-center text-xs text-slate-700">
              <MapPin className="h-3.5 w-3.5 mr-1 text-slate-500" />
              {row.location}
            </span>
          ) : null}
          <Button asChild size="sm" variant="ghost" className="text-[var(--brand-navy)]">
            <Link href={`/admin/dashboard/courses`}>
              Course <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ClassroomMonitorPanel() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [rows, setRows] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (window: 'upcoming' | 'past') => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/classroom/monitor?window=${window}`, {
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load sessions')
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(tab)
  }, [tab, load])

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'upcoming' | 'past')}>
        <TabsList className="bg-white border border-slate-200 w-full sm:w-auto">
          <TabsTrigger
            value="upcoming"
            className="flex-1 sm:flex-none data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white"
          >
            Upcoming
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="flex-1 sm:flex-none data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white"
          >
            Past sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {error ? (
            <p className="text-sm text-red-900 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
          ) : null}
          {loading ? (
            <p className="text-sm text-slate-600">Loading sessions…</p>
          ) : rows.length === 0 ? (
            <Card className="border-slate-200 bg-white">
              <CardContent className="py-10 text-center text-slate-600">
                No {tab === 'upcoming' ? 'upcoming' : 'past'} sessions scheduled.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {rows.map((row) => (
                <SessionCard key={row.id} row={row} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
