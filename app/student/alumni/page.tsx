'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getStudentPortalData } from '@/app/actions/student-learning'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

export default function StudentAlumniProfilePage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [form, setForm] = useState({
    programmeTitle: '',
    graduationYear: '',
    headline: '',
    bio: '',
    linkedinUrl: '',
    isPublic: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    void (async () => {
      const portal = await getStudentPortalData()
      if (!portal.success) {
        router.push('/auth/login?redirect=/student/alumni')
        return
      }
      setUserName(
        [portal.data.user.firstName, portal.data.user.lastName].filter(Boolean).join(' ') ||
          portal.data.user.email
      )
      const res = await fetch('/api/student/alumni', { credentials: 'same-origin' })
      if (res.ok) {
        const profile = await res.json()
        if (profile) {
          setForm({
            programmeTitle: profile.programmeTitle ?? '',
            graduationYear: profile.graduationYear ? String(profile.graduationYear) : '',
            headline: profile.headline ?? '',
            bio: profile.bio ?? '',
            linkedinUrl: profile.linkedinUrl ?? '',
            isPublic: Boolean(profile.isPublic),
          })
        }
      }
      setLoading(false)
    })()
  }, [router])

  const save = async () => {
    setSaving(true)
    setMessage('')
    const res = await fetch('/api/student/alumni', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        ...form,
        graduationYear: form.graduationYear ? Number(form.graduationYear) : null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setMessage(data.error || 'Save failed')
      return
    }
    setMessage('Alumni profile saved.')
  }

  if (loading) return <p className="text-slate-600 p-6">Loading…</p>

  return (
    <StudentPortalShell userName={userName}>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alumni profile</h1>
          <p className="text-sm text-slate-600 mt-1">
            Share your graduate story on the public{' '}
            <Link href="/alumni" className="text-[var(--brand-navy)] underline">
              alumni directory
            </Link>
            .
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your public profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {message ? <p className="text-sm text-slate-700">{message}</p> : null}
            <div className="space-y-2">
              <Label>Programme completed</Label>
              <Input
                value={form.programmeTitle}
                onChange={(e) => setForm((f) => ({ ...f, programmeTitle: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Graduation year</Label>
              <Input
                type="number"
                value={form.graduationYear}
                onChange={(e) => setForm((f) => ({ ...f, graduationYear: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={form.headline}
                onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input
                value={form.linkedinUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
              />
              Show my profile on the public alumni page
            </label>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </StudentPortalShell>
  )
}
