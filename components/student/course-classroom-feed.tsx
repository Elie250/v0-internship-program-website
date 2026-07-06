'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarClock, ExternalLink, Megaphone } from 'lucide-react'

type Announcement = {
  id: string
  title: string
  message: string
  created_at: string
}

type ClassSession = {
  id: string
  topic: string
  scheduled_at: string
  duration_minutes: number | null
  meeting_link: string | null
  location: string | null
  recording_url: string | null
  notes: string | null
  session_materials?: string | null
  pre_session_checklist?: string | null
}

export function CourseClassroomFeed({ courseId }: { courseId: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/student/classroom?courseId=${courseId}`, { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : { announcements: [], sessions: [] }))
      .then((data) => {
        setAnnouncements(data.announcements ?? [])
        setSessions(data.sessions ?? [])
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [courseId])

  const [checkInMsg, setCheckInMsg] = useState('')

  const checkIn = async (sessionId: string) => {
    setCheckInMsg('')
    const res = await fetch('/api/student/attendance', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, courseId }),
    })
    const data = await res.json()
    setCheckInMsg(res.ok ? 'Attendance recorded — thank you!' : data.error || 'Check-in failed')
  }

  const nowMs = Date.now()
  const upcoming = sessions.filter(
    (s) => new Date(s.scheduled_at).getTime() >= nowMs - 3_600_000
  )
  const recordings = sessions.filter((s) => s.recording_url)

  if (!loaded || (announcements.length === 0 && upcoming.length === 0 && recordings.length === 0)) {
    return null
  }

  return (
    <div className="space-y-4">
      {checkInMsg ? <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-2">{checkInMsg}</p> : null}
      {upcoming.length > 0 ? (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <CalendarClock className="h-4 w-4 text-[var(--brand-navy)]" />
              Upcoming class sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.slice(0, 5).map((s) => (
              <div key={s.id} className="rounded-lg border border-blue-200 bg-white p-3 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900 text-sm">{s.topic}</p>
                  <Badge className="bg-blue-100 text-blue-800">
                    {new Date(s.scheduled_at).toLocaleString()}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">
                  {s.duration_minutes ? `${s.duration_minutes} min` : ''}
                  {s.duration_minutes && s.location ? ' · ' : ''}
                  {s.location ?? ''}
                </p>
                {s.notes ? <p className="text-xs text-slate-700">{s.notes}</p> : null}
                {s.meeting_link ? (
                  <a
                    href={s.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-navy)] underline"
                  >
                    Join session <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 border-slate-300"
                  onClick={() => checkIn(s.id)}
                >
                  Check in (attendance)
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {announcements.length > 0 ? (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <Megaphone className="h-4 w-4 text-[var(--brand-navy)]" />
              Class announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {announcements.slice(0, 5).map((a) => (
              <div key={a.id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-medium text-slate-900 text-sm">{a.title}</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{a.message}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
