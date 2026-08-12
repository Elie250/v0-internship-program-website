'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TalentShell } from '@/components/recruitment/talent-ui'

type ApplyFlowProps = {
  orgSlug: string
  jobSlug: string
  jobId: string
  jobTitle: string
  organizationName: string
}

type Document = { id: string; original_filename: string; created_at: string }

export function ApplyFlow({
  orgSlug,
  jobSlug,
  jobId,
  jobTitle,
  organizationName,
}: ApplyFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedCvId, setSelectedCvId] = useState('')
  const [profileForm, setProfileForm] = useState({
    headline: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    portfolioUrl: '',
    githubUrl: '',
    summary: '',
    skills: '',
  })

  useEffect(() => {
    void (async () => {
      const meRes = await fetch('/api/recruitment/me', { credentials: 'same-origin' })
      if (meRes.status === 401) {
        router.replace(`/jobs/auth/continue?redirect=${encodeURIComponent(`/o/${orgSlug}/jobs/${jobSlug}/apply`)}`)
        return
      }
      const me = await meRes.json()
      const profile = me.candidateProfile
      if (profile) {
        setProfileForm({
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
      if (me.cvStatus?.hasCv && me.cvStatus.filename) {
        // will load full doc list below
      }

      const docsRes = await fetch('/api/recruitment/candidate/documents', { credentials: 'same-origin' })
      const docsData = await docsRes.json()
      const cvs = (docsData.documents ?? []).filter((d: Document & { document_type?: string }) => d.document_type === 'cv')
      setDocuments(cvs)
      if (cvs[0]?.id) setSelectedCvId(cvs[0].id)

      const applyRes = await fetch(`/api/recruitment/candidate/apply/${jobId}`, { credentials: 'same-origin' })
      if (applyRes.ok) {
        const applyData = await applyRes.json()
        if (applyData.existingApplication) {
          setMessage('You already have an active application for this role.')
          setStep(4)
        }
      }

      setLoading(false)
    })()
  }, [jobId, jobSlug, orgSlug, router])

  const skillsPreview = useMemo(
    () =>
      profileForm.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [profileForm.skills]
  )

  const saveProfile = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/recruitment/candidate/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          ...profileForm,
          skills: skillsPreview,
          consentPrivacy: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save profile')
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setBusy(false)
    }
  }

  const uploadCv = async (file: File) => {
    setBusy(true)
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
      setDocuments((prev) => [data.document, ...prev])
      setSelectedCvId(data.document.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    if (!selectedCvId) {
      setError('Select or upload a CV before submitting.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/recruitment/candidate/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ jobId, cvDocumentId: selectedCvId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setMessage('Application submitted successfully.')
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <TalentShell title="Apply">
        <p className="text-slate-600">Loading application…</p>
      </TalentShell>
    )
  }

  return (
    <TalentShell title={`Apply — ${jobTitle}`} subtitle={organizationName}>
      <div className="max-w-2xl space-y-6">
        <ol className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
          {['Profile', 'CV', 'Review', 'Done'].map((label, index) => (
            <li
              key={label}
              className={`rounded-full px-3 py-1 border ${step === index + 1 ? 'border-[var(--brand-navy)] text-[var(--brand-navy)]' : 'border-slate-200'}`}
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>

        {error ? (
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
        ) : null}
        {message ? (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md p-2">{message}</p>
        ) : null}

        {step === 1 ? (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Your profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headline">Professional headline</Label>
                <Input id="headline" value={profileForm.headline} onChange={(e) => setProfileForm((f) => ({ ...f, headline: e.target.value }))} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={profileForm.location} onChange={(e) => setProfileForm((f) => ({ ...f, location: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Professional summary</Label>
                <Textarea id="summary" value={profileForm.summary} onChange={(e) => setProfileForm((f) => ({ ...f, summary: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input id="skills" value={profileForm.skills} onChange={(e) => setProfileForm((f) => ({ ...f, skills: e.target.value }))} />
              </div>
              <Button onClick={() => void saveProfile()} disabled={busy} className="bg-[var(--brand-navy)] text-white">
                Continue to CV
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Your CV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cv">Upload CV (PDF or Word, max 10 MB)</Label>
                <Input
                  id="cv"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void uploadCv(file)
                  }}
                />
              </div>
              {documents.length > 0 ? (
                <div className="space-y-2">
                  <Label>Select CV for this application</Label>
                  {documents.map((doc) => (
                    <label key={doc.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="cv"
                        checked={selectedCvId === doc.id}
                        onChange={() => setSelectedCvId(doc.id)}
                      />
                      {doc.original_filename}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">Upload a CV to continue.</p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!selectedCvId}
                  className="bg-[var(--brand-navy)] text-white"
                >
                  Review application
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === 3 ? (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Review &amp; submit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <p>
                <strong>Role:</strong> {jobTitle} at {organizationName}
              </p>
              <p>
                <strong>Headline:</strong> {profileForm.headline || '—'}
              </p>
              <p>
                <strong>CV:</strong>{' '}
                {documents.find((d) => d.id === selectedCvId)?.original_filename ?? '—'}
              </p>
              <p className="text-xs text-slate-500">
                Your profile snapshot and selected CV will be preserved with this application even if you update them later.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={() => void submit()} disabled={busy} className="bg-[var(--brand-navy)] text-white">
                  {busy ? 'Submitting…' : 'Submit application'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === 4 ? (
          <Card className="border-slate-200">
            <CardContent className="p-6 space-y-4">
              <p className="text-slate-800">{message || 'Application complete.'}</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/app">
                  <Button className="bg-[var(--brand-navy)] text-white">Go to dashboard</Button>
                </Link>
                <Link href="/jobs">
                  <Button variant="outline">Browse more jobs</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </TalentShell>
  )
}
