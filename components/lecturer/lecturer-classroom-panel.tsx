'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CalendarClock, ExternalLink, Megaphone, Trash2, Users } from 'lucide-react'

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

export function LecturerClassroomPanel({ courseId }: { courseId: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [kitNotice, setKitNotice] = useState('')

  const [annForm, setAnnForm] = useState({ title: '', message: '', scope: 'class' as 'class' | 'programme' | 'platform' })
  const [annSaving, setAnnSaving] = useState(false)

  const [sessionForm, setSessionForm] = useState({
    topic: '',
    scheduled_at: '',
    duration_minutes: '',
    meeting_link: '',
    location: '',
    notes: '',
    session_materials: '',
    pre_session_checklist: '',
  })
  const [sessionSaving, setSessionSaving] = useState(false)
  const [attendanceSessionId, setAttendanceSessionId] = useState<string | null>(null)

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
      if (data.kitColumnsReady === false) {
        setKitNotice(
          'Session materials/checklist need scripts/39-phase4-classroom.sql in Supabase. Until then, those fields are saved inside session notes.'
        )
      } else {
        setKitNotice('')
      }
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
      setAnnForm({ title: '', message: '', scope: 'class' })
      setMessage(
        annForm.scope === 'class'
          ? 'Announcement posted — students see it on their course page and Announcements tab.'
          : annForm.scope === 'programme'
            ? 'Announcement published to this programme — enrolled students see it on Announcements.'
            : 'Public announcement published — all students see it on their Announcements tab.'
      )
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
        session_materials: '',
        pre_session_checklist: '',
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
      {kitNotice ? (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md p-3">
          {kitNotice}
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
              Choose who sees the update — class-only posts also appear on the student Announcements tab.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 border rounded-lg p-3 bg-slate-50/60">
              <div>
                <Label>Audience</Label>
                <select
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={annForm.scope}
                  onChange={(e) =>
                    setAnnForm({
                      ...annForm,
                      scope: e.target.value as 'class' | 'programme' | 'platform',
                    })
                  }
                >
                  <option value="class">This class only (course page + Announcements)</option>
                  <option value="programme">This programme (Announcements tab)</option>
                  <option value="platform">All students (public announcement)</option>
                </select>
              </div>
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
              <div>
                <Label>Session materials (links or file URLs, one per line)</Label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  value={sessionForm.session_materials}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, session_materials: e.target.value })
                  }
                  placeholder="https://…/slides.pdf&#10;https://…/lab-sheet"
                />
              </div>
              <div>
                <Label>Pre-session checklist (one item per line)</Label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  value={sessionForm.pre_session_checklist}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, pre_session_checklist: e.target.value })
                  }
                  placeholder="Laptop charged&#10;Multimeter&#10;Safety goggles"
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
                      <SessionRow
                        key={s.id}
                        courseId={courseId}
                        session={s}
                        onDelete={() => remove('session', s.id)}
                        onAttendance={() =>
                          setAttendanceSessionId((prev) => (prev === s.id ? null : s.id))
                        }
                        attendanceOpen={attendanceSessionId === s.id}
                      />
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
                        courseId={courseId}
                        session={s}
                        past
                        onDelete={() => remove('session', s.id)}
                        onAttendance={() =>
                          setAttendanceSessionId((prev) => (prev === s.id ? null : s.id))
                        }
                        attendanceOpen={attendanceSessionId === s.id}
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

function SessionAttendanceEditor({
  courseId,
  sessionId,
}: {
  courseId: string
  sessionId: string
}) {
  type Student = { enrollmentId: string; userId: string | null; name: string; email: string }
  type AttendanceRow = { enrollment_id: string; status: string; self_checked_in?: boolean }

  const [students, setStudents] = useState<Student[]>([])
  const [statusByEnrollment, setStatusByEnrollment] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setMsg('')
      try {
        const [progressRes, attendanceRes] = await Promise.all([
          fetch(`/api/lecturer/courses/${courseId}/progress`, { credentials: 'same-origin' }),
          fetch(
            `/api/lecturer/courses/${courseId}/attendance?sessionId=${encodeURIComponent(sessionId)}`,
            { credentials: 'same-origin' }
          ),
        ])
        const progressData = await progressRes.json()
        const attendanceData = await attendanceRes.json()
        if (!progressRes.ok) throw new Error(progressData.error || 'Failed to load students')

        const roster: Student[] = (progressData.students ?? []).map(
          (s: { enrollmentId: string; userId: string | null; name: string; email: string }) => ({
            enrollmentId: s.enrollmentId,
            userId: s.userId,
            name: s.name,
            email: s.email,
          })
        )
        setStudents(roster)

        const initial: Record<string, string> = {}
        for (const row of (Array.isArray(attendanceData) ? attendanceData : []) as AttendanceRow[]) {
          initial[row.enrollment_id] = row.status || 'present'
        }
        for (const s of roster) {
          if (!initial[s.enrollmentId]) initial[s.enrollmentId] = 'absent'
        }
        setStatusByEnrollment(initial)
      } catch (err) {
        setMsg(err instanceof Error ? err.message : 'Failed to load attendance')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [courseId, sessionId])

  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      const records = students.map((s) => ({
        enrollmentId: s.enrollmentId,
        userId: s.userId,
        status: statusByEnrollment[s.enrollmentId] || 'absent',
      }))
      const res = await fetch(`/api/lecturer/courses/${courseId}/attendance`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, records }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save attendance')
      setMsg('Attendance saved.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-xs text-slate-500 mt-2">Loading roster…</p>

  return (
    <div className="mt-3 border-t border-slate-200 pt-3 space-y-2">
      <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
        <Users className="h-3.5 w-3.5" /> Mark attendance
      </p>
      {students.length === 0 ? (
        <p className="text-xs text-slate-500">No admitted students yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {students.map((s) => (
            <li key={s.enrollmentId} className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-800">
                {s.name} <span className="text-slate-500">({s.email})</span>
              </span>
              <select
                className="border border-slate-300 rounded px-2 py-1 text-slate-900 bg-white"
                value={statusByEnrollment[s.enrollmentId] ?? 'absent'}
                onChange={(e) =>
                  setStatusByEnrollment((prev) => ({
                    ...prev,
                    [s.enrollmentId]: e.target.value,
                  }))
                }
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="excused">Excused</option>
              </select>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="bg-[var(--brand-navy)] text-white h-7 text-xs"
          disabled={saving || students.length === 0}
          onClick={() => void save()}
        >
          {saving ? 'Saving…' : 'Save attendance'}
        </Button>
        {msg ? <span className="text-xs text-slate-600">{msg}</span> : null}
      </div>
    </div>
  )
}

function SessionRow({
  courseId,
  session,
  past = false,
  onDelete,
  onAttendance,
  attendanceOpen = false,
}: {
  courseId: string
  session: ClassSession
  past?: boolean
  onDelete: () => void
  onAttendance?: () => void
  attendanceOpen?: boolean
}) {
  return (
    <div
      className={`border rounded-lg p-3 ${
        past ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 space-y-1 flex-1">
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
        {session.session_materials ? (
          <div className="text-xs text-slate-700">
            <p className="font-medium">Materials:</p>
            <ul className="list-disc pl-4">
              {session.session_materials.split('\n').filter(Boolean).map((line) => (
                <li key={line}>
                  {line.startsWith('http') ? (
                    <a href={line} target="_blank" rel="noopener noreferrer" className="underline text-[var(--brand-navy)]">
                      {line}
                    </a>
                  ) : (
                    line
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {session.pre_session_checklist ? (
          <div className="text-xs text-slate-700">
            <p className="font-medium">Checklist:</p>
            <ul className="list-disc pl-4">
              {session.pre_session_checklist.split('\n').filter(Boolean).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}
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
          {onAttendance ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[var(--brand-navy)] font-medium underline"
              onClick={onAttendance}
            >
              <Users className="h-3 w-3" />
              {attendanceOpen ? 'Hide attendance' : 'Mark attendance'}
            </button>
          ) : null}
        </div>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
      </div>
      {attendanceOpen ? (
        <SessionAttendanceEditor courseId={courseId} sessionId={session.id} />
      ) : null}
    </div>
  )
}
