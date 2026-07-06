'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Megaphone, Video } from 'lucide-react'

export function LecturerBroadcastPanel() {
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [annForm, setAnnForm] = useState({ title: '', message: '' })
  const [annSaving, setAnnSaving] = useState(false)

  const [webForm, setWebForm] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    meeting_link: '',
  })
  const [webSaving, setWebSaving] = useState(false)

  const postPublicAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.message.trim()) {
      setError('Announcement title and message are required')
      return
    }
    setAnnSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/lecturer/announcements', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post announcement')
      setAnnForm({ title: '', message: '' })
      setMessage('Public announcement published — all students see it on their Announcements tab.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post announcement')
    } finally {
      setAnnSaving(false)
    }
  }

  const publishWebinar = async () => {
    if (!webForm.title.trim()) {
      setError('Webinar title is required')
      return
    }
    setWebSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/lecturer/webinars', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to publish webinar')
      setWebForm({ title: '', description: '', scheduled_at: '', meeting_link: '' })
      setMessage('Webinar published — admitted students see it under Webinars and Announcements.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish webinar')
    } finally {
      setWebSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">
          {message}
        </p>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <Megaphone className="h-4 w-4" /> Public announcement
            </CardTitle>
            <p className="text-xs text-slate-500">
              Published to all students with your name as the author.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                className="mt-1"
                value={annForm.title}
                onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                placeholder="e.g., Holiday schedule update"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                className="mt-1"
                rows={3}
                value={annForm.message}
                onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })}
              />
            </div>
            <Button
              type="button"
              onClick={postPublicAnnouncement}
              disabled={annSaving}
              className="bg-[var(--brand-navy)] text-white"
            >
              {annSaving ? 'Publishing…' : 'Publish announcement'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <Video className="h-4 w-4" /> Public webinar
            </CardTitle>
            <p className="text-xs text-slate-500">
              Schedule a live webinar — you are listed as the host.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                className="mt-1"
                value={webForm.title}
                onChange={(e) => setWebForm({ ...webForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-1"
                rows={2}
                value={webForm.description}
                onChange={(e) => setWebForm({ ...webForm, description: e.target.value })}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Date &amp; time</Label>
                <Input
                  className="mt-1"
                  type="datetime-local"
                  value={webForm.scheduled_at}
                  onChange={(e) => setWebForm({ ...webForm, scheduled_at: e.target.value })}
                />
              </div>
              <div>
                <Label>Meeting link</Label>
                <Input
                  className="mt-1"
                  value={webForm.meeting_link}
                  onChange={(e) => setWebForm({ ...webForm, meeting_link: e.target.value })}
                  placeholder="https://meet.google.com/…"
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={publishWebinar}
              disabled={webSaving}
              className="bg-[var(--brand-navy)] text-white"
            >
              {webSaving ? 'Publishing…' : 'Publish webinar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
