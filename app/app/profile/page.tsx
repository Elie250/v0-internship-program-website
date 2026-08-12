'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TalentShell } from '@/components/recruitment/talent-ui'

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
    if (profile) {
      setForm({
        headline: profile.headline ?? '',
        phone: profile.phone ?? '',
        location: profile.location ?? '',
        linkedinUrl: profile.linkedin_url ?? '',
        portfolioUrl: profile.portfolio_url ?? '',
        githubUrl: profile.github_url ?? '',
        summary: profile.summary ?? '',
        skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
      })
    }

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
      <TalentShell title="Profile">
        <p className="text-slate-600">Loading profile…</p>
      </TalentShell>
    )
  }

  return (
    <TalentShell title="Your profile" subtitle="Reusable across all employers on Energy & Logics Talent">
      <div className="max-w-2xl space-y-6">
        {error ? (
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
        ) : null}
        {message ? (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md p-2">{message}</p>
        ) : null}

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Professional profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input id="headline" value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea id="summary" value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input id="skills" value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" value={form.linkedinUrl} onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio</Label>
              <Input id="portfolio" value={form.portfolioUrl} onChange={(e) => setForm((f) => ({ ...f, portfolioUrl: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub</Label>
              <Input id="github" value={form.githubUrl} onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))} />
            </div>
            <Button onClick={() => void save()} disabled={saving} className="bg-[var(--brand-navy)] text-white">
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200" id="cv">
          <CardHeader>
            <CardTitle>CV documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cv-upload">Upload CV</Label>
              <Input
                id="cv-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void uploadCv(file)
                }}
              />
            </div>
            {documents.filter((d) => d.document_type === 'cv').length === 0 ? (
              <p className="text-sm text-slate-600">No CV uploaded yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {documents
                  .filter((d) => d.document_type === 'cv')
                  .map((doc) => (
                    <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 rounded-md p-3">
                      <span>{doc.original_filename}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => void downloadDoc(doc.id)}>
                          Download
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void deleteDoc(doc.id)}>
                          Remove
                        </Button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Link href="/app" className="text-sm text-[var(--brand-navy)] underline">
          Back to dashboard
        </Link>
      </div>
    </TalentShell>
  )
}
