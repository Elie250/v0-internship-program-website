'use client'

import { useEffect, useMemo, useState } from 'react'
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

type ApplyFlowProps = {
  orgSlug: string
  jobSlug: string
  jobId: string
  jobTitle: string
  organizationName: string
}

type Document = { id: string; original_filename: string; created_at: string }

const STEPS = ['Profile', 'CV', 'Review', 'Done'] as const

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
        router.replace(
          `/jobs/auth/continue?redirect=${encodeURIComponent(`/o/${orgSlug}/jobs/${jobSlug}/apply`)}`
        )
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

      const docsRes = await fetch('/api/recruitment/candidate/documents', { credentials: 'same-origin' })
      const docsData = await docsRes.json()
      const cvs = (docsData.documents ?? []).filter(
        (d: Document & { document_type?: string }) => d.document_type === 'cv'
      )
      setDocuments(cvs)
      if (cvs[0]?.id) setSelectedCvId(cvs[0].id)

      const applyRes = await fetch(`/api/recruitment/candidate/apply/${jobId}`, {
        credentials: 'same-origin',
      })
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
        <LoadingBlock label="Preparing your application…" />
      </TalentShell>
    )
  }

  return (
    <TalentShell
      title={`Apply — ${jobTitle}`}
      subtitle={`${organizationName} · Step ${Math.min(step, 3)} of 3`}
    >
      <div className="max-w-2xl space-y-6">
        <div className="mb-1">
          <Link
            href={`/o/${orgSlug}/jobs/${jobSlug}`}
            className="text-sm font-medium text-[var(--brand-navy)] hover:underline"
          >
            ← Back to role details
          </Link>
        </div>

        <ol className="grid grid-cols-4 gap-2">
          {STEPS.map((label, index) => {
            const n = index + 1
            const active = step === n
            const done = step > n
            return (
              <li
                key={label}
                className={`rounded-xl border px-2 py-2.5 text-center text-xs font-medium ${
                  active
                    ? 'border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white'
                    : done
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                <span className="block sm:hidden">{n}</span>
                <span className="hidden sm:block">
                  {n}. {label}
                </span>
              </li>
            )
          })}
        </ol>

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {message && step === 4 ? <StatusBanner tone="success">{message}</StatusBanner> : null}

        {step === 1 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Your profile</h2>
              <p className="text-sm text-slate-600 mt-1">
                Reusable across employers. Update once — apply many times.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="headline">Professional headline</Label>
              <Input
                id="headline"
                value={profileForm.headline}
                onChange={(e) => setProfileForm((f) => ({ ...f, headline: e.target.value }))}
                placeholder="e.g. Mechanical Engineer · CAD & manufacturing"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm((f) => ({ ...f, location: e.target.value }))}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Professional summary</Label>
              <Textarea
                id="summary"
                value={profileForm.summary}
                onChange={(e) => setProfileForm((f) => ({ ...f, summary: e.target.value }))}
                className="min-h-28 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                value={profileForm.skills}
                onChange={(e) => setProfileForm((f) => ({ ...f, skills: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
            <Button
              onClick={() => void saveProfile()}
              disabled={busy}
              className="h-11 rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]"
            >
              {busy ? 'Saving…' : 'Continue to CV'}
            </Button>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Your CV</h2>
              <p className="text-sm text-slate-600 mt-1">PDF or Word · max 10 MB</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cv">Upload CV</Label>
              <Input
                id="cv"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="rounded-xl"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void uploadCv(file)
                }}
              />
            </div>
            {documents.length > 0 ? (
              <div className="space-y-2">
                <Label>Select CV for this application</Label>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <label
                      key={doc.id}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm cursor-pointer transition-colors ${
                        selectedCvId === doc.id
                          ? 'border-[var(--brand-navy)] bg-[var(--brand-navy)]/5 text-slate-900'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cv"
                        className="accent-[var(--brand-navy)]"
                        checked={selectedCvId === doc.id}
                        onChange={() => setSelectedCvId(doc.id)}
                      />
                      <span className="truncate">{doc.original_filename}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="No CV yet" description="Upload a CV to continue this application." />
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedCvId}
                className="rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]"
              >
                Review application
              </Button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Review &amp; submit</h2>
              <p className="text-sm text-slate-600 mt-1">Confirm the snapshot employers will receive.</p>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex flex-col gap-0.5 rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-xs uppercase tracking-wider text-slate-500">Role</dt>
                <dd className="font-medium text-slate-900">
                  {jobTitle} · {organizationName}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5 rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-xs uppercase tracking-wider text-slate-500">Headline</dt>
                <dd className="text-slate-800">{profileForm.headline || '—'}</dd>
              </div>
              <div className="flex flex-col gap-0.5 rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-xs uppercase tracking-wider text-slate-500">CV</dt>
                <dd className="text-slate-800">
                  {documents.find((d) => d.id === selectedCvId)?.original_filename ?? '—'}
                </dd>
              </div>
            </dl>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your profile snapshot and selected CV are preserved with this application even if you
              update them later.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={() => void submit()}
                disabled={busy}
                className="rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]"
              >
                {busy ? 'Submitting…' : 'Submit application'}
              </Button>
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">You&apos;re all set</h2>
              <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">
                {message || 'Application complete. Track status from your dashboard.'}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/app">
                <Button className="rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]">
                  Go to dashboard
                </Button>
              </Link>
              <Link href="/jobs">
                <Button variant="outline" className="rounded-xl">
                  Browse more jobs
                </Button>
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </TalentShell>
  )
}
