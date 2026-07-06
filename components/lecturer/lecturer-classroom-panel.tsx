'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CalendarClock, ExternalLink, Megaphone, Trash2 } from 'lucide-react'

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
}

export function LecturerClassroomPanel({ courseId }: { courseId: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [annForm, setAnnForm] = useState({ title: '', message: '' })
  const [annSaving, setAnnSaving] = useState(false)

  const [sessionForm, setSessionForm] = useState({
    topic: '',
    scheduled_at: '',
    duration_minutes: '',
    meeting_link: '',
    location: '',
    notes: '',
  })
  const [sessionSaving, setSessionSaving] = useState(false)

  const base = `/api/lecturer/courses/${courseId}/classroom`

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(base, { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load classroom data')
      setAnnouncements(data.announcements ?? [])
      setSessions(data.sessions ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load classroom data')
    } finally {
      setLoading(false)
    }
  }, [base])

  useEffect(() => {
    void load()
  }, [load])

  const postAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.message.trim()) {
      setError('Announcement title and message are required')
      return
    }
    setAnnSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(base, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'announcement', ...annForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post announcement')
      setAnnForm({ title: '', message: '' })
      setMessage('Announcement posted — students see it on their course page.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post announcement')
    } finally {
      setAnnSaving(false)
    }
  }

  const addSession = async () => {
    if (!sessionForm.topic.trim() || !sessionForm.scheduled_at) {
      setError('Session topic and date/time are required')
      return
    }
    setSessionSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(base, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'session', ...sessionForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add session')
      setSessionForm({
        topic: '',
        scheduled_at: '',
        duration_minutes: '',
        meeting_link: '',
        location: '',
        notes: '',
      })
      setMessage('Session scheduled — it appears on the students’ course page.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add session')
    } finally {
      setSessionSaving(false)
    }
  }

  const remove = async (kind: 'announcement' | 'session', itemId: string) => {
    if (!confirm(kind === 'announcement' ? 'Delete this announcement?' : 'Delete this session?')) {
      return
    }
    setError('')
    try {
      const res = await fetch(`${base}?kind=${kind}&itemId=${itemId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const nowMs = Date.now()
  const upcoming = sessions.filter((s) => new Date(s.scheduled_at).getTime() >= nowMs - 3_600_000)
  const past = sessions
    .filter((s) => new Date(s.scheduled_at).getTime() < nowMs - 3_600_000)
    .reverse()

  if (loading) {
    return <p className="text-sm text-slate-600 py-6">Loading classroom…</p>
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">
          {message}
        </p>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Announcements */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <Megaphone className="h-4 w-4" /> Class announcements
            </CardTitle>
            <p className="text-xs text-slate-500">
              Visible to all admitted students of this programme on their course page.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 border rounded-lg p-3 bg-slate-50/60">
              <div>
                <Label>Title</Label>
                <Input
                  className="mt-1"
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  placeholder="e.g., Lab moved to Room B on Friday"
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  className="mt-1"
                  rows={3}
                  value={annForm.message}
                  onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })}
                  placeholder="Details students need to know…"
                />
              </div>
              <Button
                type="button"
                onClick={postAnnouncement}
                disabled={annSaving}
                className="bg-[var(--brand-navy)] text-white"
              >
                {annSaving ? 'Posting…' : 'Post announcement'}
              </Button>
            </div>

            {announcements.length === 0 ? (
              <p className="text-sm text-slate-600">No announcements yet.</p>
            ) : (
              <ul className="space-y-2">
                {announcements.map((a) => (
                  <li key={a.id} className="border rounded-lg p-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 text-sm">{a.title}</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{a.message}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(a.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove('announcement', a.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Session schedule */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <CalendarClock className="h-4 w-4" /> Live session schedule
            </CardTitle>
            <p className="text-xs text-slate-500">
              Plan classes and labs — students see upcoming sessions with join links.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 border rounded-lg p-3 bg-slate-50/60">
              <div>
                <Label>Topic</Label>
                <Input
                  className="mt-1"
                  value={sessionForm.topic}
                  onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                  placeholder="e.g., Week 3 — PLC ladder logic lab"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Date &amp; time</Label>
                  <Input
                    className="mt-1"
                    type="datetime-local"
                    value={sessionForm.scheduled_at}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, scheduled_at: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min="0"
                    value={sessionForm.duration_minutes}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, duration_minutes: e.target.value })
                    }
                    placeholder="90"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Meeting link (online)</Label>
                  <Input
                    className="mt-1"
                    value={sessionForm.meeting_link}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, meeting_link: e.target.value })
                    }
                    placeholder="https://meet.google.com/…"
                  />
                </div>
                <div>
                  <Label>Location (in person)</Label>
                  <Input
                    className="mt-1"
                    value={sessionForm.location}
                    onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                    placeholder="e.g., Lab Room B, Kigali"
                  />
                </div>
              </div>
              <div>
                <Label>Notes for students (optional)</Label>
                <Input
                  className="mt-1"
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                  placeholder="e.g., Bring your multimeter and laptop"
                />
              </div>
              <Button
                type="button"
                onClick={addSession}
                disabled={sessionSaving}
                className="bg-[var(--brand-navy)] text-white"
              >
                {sessionSaving ? 'Saving…' : 'Add session'}
              </Button>
            </div>

            {upcoming.length === 0 && past.length === 0 ? (
              <p className="text-sm text-slate-600">No sessions scheduled yet.</p>
            ) : (
              <div className="space-y-4">
                {upcoming.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Upcoming
                    </p>
                    {upcoming.map((s) => (
                      <SessionRow key={s.id} session={s} onDelete={() => remove('session', s.id)} />
                    ))}
                  </div>
                ) : null}
                {past.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Past
                    </p>
                    {past.slice(0, 10).map((s) => (
                      <SessionRow
                        key={s.id}
                        session={s}
                        past
                        onDelete={() => remove('session', s.id)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SessionRow({
  session,
  past = false,
  onDelete,
}: {
  session: ClassSession
  past?: boolean
  onDelete: () => void
}) {
  return (
    <div
      className={`border rounded-lg p-3 flex items-start justify-between gap-2 ${
        past ? 'opacity-70' : ''
      }`}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-slate-900 text-sm">{session.topic}</p>
          {!past ? <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge> : null}
        </div>
        <p className="text-xs text-slate-600">
          {new Date(session.scheduled_at).toLocaleString()}
          {session.duration_minutes ? ` · ${session.duration_minutes} min` : ''}
          {session.location ? ` · ${session.location}` : ''}
        </p>
        {session.notes ? <p className="text-xs text-slate-600">{session.notes}</p> : null}
        <div className="flex flex-wrap gap-3 text-xs">
          {session.meeting_link ? (
            <a
              href={session.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[var(--brand-navy)] font-medium underline"
            >
              Join link <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          {session.recording_url ? (
            <a
              href={session.recording_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[var(--brand-navy)] font-medium underline"
            >
              Recording <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}
