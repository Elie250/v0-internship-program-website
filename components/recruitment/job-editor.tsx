'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatusBanner } from '@/components/recruitment/talent-ui'
import { serializeApplicationDeadlineInput } from '@/lib/recruitment/job-deadline'

export type JobFormValues = {
  title: string
  department: string
  location: string
  employmentType: string
  workMode: string
  category: string
  description: string
  responsibilities: string
  requirements: string
  qualifications: string
  skills: string
  salaryMin: string
  salaryMax: string
  salaryCurrency: string
  salaryVisible: boolean
  applicationDeadline: string
  status: string
  visibility: string
}

const EMPTY: JobFormValues = {
  title: '',
  department: '',
  location: '',
  employmentType: 'full_time',
  workMode: 'on_site',
  category: '',
  description: '',
  responsibilities: '',
  requirements: '',
  qualifications: '',
  skills: '',
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: 'RWF',
  salaryVisible: false,
  applicationDeadline: '',
  status: 'draft',
  visibility: 'public',
}

export function JobEditor({
  organizationId,
  jobId,
  initial,
}: {
  organizationId: string
  jobId?: string
  initial?: Partial<JobFormValues>
}) {
  const router = useRouter()
  const [form, setForm] = useState<JobFormValues>({ ...EMPTY, ...initial })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      const payload = {
        jobId,
        title: form.title,
        department: form.department,
        location: form.location,
        employmentType: form.employmentType,
        workMode: form.workMode,
        category: form.category,
        description: form.description,
        responsibilities: form.responsibilities,
        requirements: form.requirements,
        qualifications: form.qualifications,
        skills: form.skills,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        salaryCurrency: form.salaryCurrency,
        salaryVisible: form.salaryVisible,
        applicationDeadline: serializeApplicationDeadlineInput(form.applicationDeadline),
        status: form.status,
        visibility: form.visibility,
      }
      const res = await fetch(`/api/recruitment/organizations/${organizationId}/jobs`, {
        method: jobId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      router.push(jobId ? `/employer/jobs/${data.job.id}` : `/employer/jobs/${data.job.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const set = (key: keyof JobFormValues, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label>Job title</Label>
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <Input value={form.department} onChange={(e) => set('department', e.target.value)} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Input value={form.location} onChange={(e) => set('location', e.target.value)} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Employment type</Label>
          <select
            value={form.employmentType}
            onChange={(e) => set('employmentType', e.target.value)}
            className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm"
          >
            <option value="full_time">Full time</option>
            <option value="part_time">Part time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="temporary">Temporary</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Workplace type</Label>
          <select
            value={form.workMode}
            onChange={(e) => set('workMode', e.target.value)}
            className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm"
          >
            <option value="on_site">On-site</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Remote</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Discipline / category</Label>
          <Input value={form.category} onChange={(e) => set('category', e.target.value)} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Application deadline</Label>
          <Input
            type="datetime-local"
            value={form.applicationDeadline}
            onChange={(e) => set('applicationDeadline', e.target.value)}
            className="h-11 rounded-xl"
          />
          <p className="text-xs text-slate-500">
            Optional. Leave empty for no deadline. If you pick a date at 00:00, applications stay open
            until the end of that day.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="min-h-28 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Responsibilities</Label>
        <Textarea value={form.responsibilities} onChange={(e) => set('responsibilities', e.target.value)} className="min-h-24 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Requirements</Label>
        <Textarea value={form.requirements} onChange={(e) => set('requirements', e.target.value)} className="min-h-24 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Qualifications</Label>
        <Textarea value={form.qualifications} onChange={(e) => set('qualifications', e.target.value)} className="min-h-24 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Skills (comma-separated)</Label>
        <Input value={form.skills} onChange={(e) => set('skills', e.target.value)} className="h-11 rounded-xl" />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Salary min (optional)</Label>
          <Input value={form.salaryMin} onChange={(e) => set('salaryMin', e.target.value)} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Salary max (optional)</Label>
          <Input value={form.salaryMax} onChange={(e) => set('salaryMax', e.target.value)} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Input value={form.salaryCurrency} onChange={(e) => set('salaryCurrency', e.target.value)} className="h-11 rounded-xl" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.salaryVisible} onChange={(e) => set('salaryVisible', e.target.checked)} />
        Show salary on the public listing
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published (accepting applications)</option>
            <option value="closed">Closed (not accepting applications)</option>
            <option value="archived">Archived</option>
          </select>
          <p className="text-xs text-slate-500">
            Applications open only when status is <strong>Published</strong>. A deadline does not open
            a Closed or Draft job.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Visibility</Label>
          <select
            value={form.visibility}
            onChange={(e) => set('visibility', e.target.value)}
            className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm"
          >
            <option value="public">Public job board</option>
            <option value="unlisted">Unlisted (direct link only)</option>
          </select>
        </div>
      </div>
      <Button onClick={() => void save()} disabled={busy} className="bg-[var(--brand-navy)] text-white">
        {busy ? 'Saving…' : jobId ? 'Save job' : 'Create job'}
      </Button>
    </div>
  )
}
