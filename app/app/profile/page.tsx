'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  EmptyState,
  LoadingBlock,
  StatusBanner,
  TalentShell,
} from '@/components/recruitment/talent-ui'
import { AccountSignOutButton } from '@/components/recruitment/account-menu'

type Document = { id: string; original_filename: string; created_at: string; document_type: string }

export default function CandidateProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    portfolioUrl: '',
    githubUrl: '',
    summary: '',
    skills: '',
  })

  const load = async () => {
    const meRes = await fetch('/api/recruitment/me', { credentials: 'same-origin' })
    if (meRes.status === 401) {
      router.replace('/jobs/auth/continue?redirect=/app/profile')
      return
    }
    const me = await meRes.json()
    const profile = me.candidateProfile
    setForm({
      firstName: String(me.user?.firstName ?? ''),
      lastName: String(me.user?.lastName ?? ''),
      headline: profile?.headline ?? '',
      phone: profile?.phone ?? '',
      location: profile?.location ?? '',
      linkedinUrl: profile?.linkedin_url ?? '',
      portfolioUrl: profile?.portfolio_url ?? '',
      githubUrl: profile?.github_url ?? '',
      summary: profile?.summary ?? '',
      skills: Array.isArray(profile?.skills) ? profile.skills.join(', ') : '',
    })

    const docsRes = await fetch('/api/recruitment/candidate/documents', { credentials: 'same-origin' })
    const docsData = await docsRes.json()
    setDocuments(docsData.documents ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [router])

  const save = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const skills = form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const res = await fetch('/api/recruitment/candidate/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ...form, skills, consentPrivacy: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setMessage('Profile saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const uploadCv = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      if (form.firstName.trim() || form.lastName.trim()) {
        await fetch('/api/recruitment/candidate/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            consentPrivacy: true,
          }),
        })
      }
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/recruitment/candidate/documents', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setMessage('CV uploaded.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const deleteDoc = async (documentId: string) => {
    setError('')
    try {
      const res = await fetch(`/api/recruitment/candidate/documents?documentId=${documentId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const downloadDoc = async (documentId: string) => {
    const res = await fetch(`/api/recruitment/candidate/documents/${documentId}/download`, {
      credentials: 'same-origin',
    })
    const data = await res.json()
    if (res.ok && data.url) window.open(data.url, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <TalentShell title="Your profile">
        <LoadingBlock label="Loading profile…" />
      </TalentShell>
    )
  }

  const cvs = documents.filter((d) => d.document_type === 'cv')

  return (
    <TalentShell
      title="Your profile"
      subtitle="Reusable across every employer on this platform"
    >
      <div className="max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/app" className="text-sm font-medium text-[var(--brand-navy)] hover:underline">
            ← Back to dashboard
          </Link>
          <AccountSignOutButton redirectTo="/jobs" />
        </div>

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Professional profile</h2>
            <p className="text-sm text-slate-600 mt-1">Shown to employers when you apply.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={form.headline}
              onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              className="min-h-28 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input
              id="skills"
              value={form.skills}
              onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              value={form.linkedinUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfolio</Label>
            <Input
              id="portfolio"
              value={form.portfolioUrl}
              onChange={(e) => setForm((f) => ({ ...f, portfolioUrl: e.target.value }))}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
            <Input
              id="github"
              value={form.githubUrl}
              onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))}
              className="h-11 rounded-xl"
            />
          </div>
          <Button
            onClick={() => void save()}
            disabled={saving}
            className="h-11 rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]"
          >
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </section>

        <section
          id="cv"
          className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] scroll-mt-28"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Your name and CV</h2>
            <p className="text-sm text-slate-600 mt-1">
              Add your name so employers and interview emails can address you. PDF or Word · private
              storage.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First name</Label>
              <Input
                id="first-name"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                autoComplete="given-name"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input
                id="last-name"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                autoComplete="family-name"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cv-upload">Upload CV</Label>
            <Input
              id="cv-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              disabled={uploading}
              className="rounded-xl"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void uploadCv(file)
              }}
            />
            {uploading ? <p className="text-xs text-slate-500">Uploading…</p> : null}
          </div>
          {cvs.length === 0 ? (
            <EmptyState
              title="No CV uploaded yet"
              description="Add a CV so you can apply to roles in a few steps."
            />
          ) : (
            <ul className="space-y-2">
              {cvs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{doc.original_filename}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => void downloadDoc(doc.id)}
                    >
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => void deleteDoc(doc.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </TalentShell>
  )
}
