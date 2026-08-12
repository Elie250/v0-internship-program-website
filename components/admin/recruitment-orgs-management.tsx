'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminSectionHeader } from '@/components/admin/admin-section-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { adminStatusClass } from '@/components/admin/admin-section-header'

type Org = {
  id: string
  name: string
  slug: string
  status: string
  notification_email: string | null
  description: string | null
}

type Member = {
  id: string
  role: string
  status: string
  user?: { email?: string; first_name?: string; last_name?: string } | null
}

type Job = {
  id: string
  title: string
  slug: string
  status: string
  location: string | null
}

type OrgRequest = {
  id: string
  company_name: string
  contact_email: string
  request_type: string
  status: string
  requester_notes: string | null
  review_notes: string | null
  created_at: string
  reviewed_at: string | null
  requester_user_id: string
}

export default function RecruitmentOrgsManagement() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [requests, setRequests] = useState<OrgRequest[]>([])
  const [requestFilter, setRequestFilter] = useState<'pending' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('organization_admin')
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobTitle, setJobTitle] = useState('')
  const [jobSlug, setJobSlug] = useState('')
  const [jobLocation, setJobLocation] = useState('Kigali, Rwanda')
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [orgsRes, reqRes] = await Promise.all([
        fetch('/api/recruitment/organizations', { credentials: 'same-origin' }),
        fetch(`/api/recruitment/organization-requests?status=${requestFilter}`, {
          credentials: 'same-origin',
        }),
      ])
      const orgsData = await orgsRes.json()
      const reqData = await reqRes.json()
      if (!orgsRes.ok) throw new Error(orgsData.error || 'Failed to load organizations')
      if (!reqRes.ok) throw new Error(reqData.error || 'Failed to load organization requests')
      setOrgs(orgsData.organizations ?? [])
      setRequests(reqData.requests ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [requestFilter])

  useEffect(() => {
    void load()
  }, [load])

  const reviewRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/recruitment/organization-requests', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
          reviewNotes: reviewNotes[requestId] || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Review failed')
      setNotice(
        action === 'approve'
          ? 'Organization approved and initial admin assigned. Requester notified.'
          : 'Request rejected. Requester notified.'
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed')
    }
  }

  const createOrg = async () => {
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/recruitment/organizations', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || undefined,
          status: 'active',
          adminEmail: adminEmail || undefined,
          adminRole: 'organization_admin',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Create failed')
      setName('')
      setSlug('')
      setAdminEmail('')
      const parts = [`Created and activated ${data.organization.name}`]
      if (data.membership) parts.push('Hiring access granted to the company admin email.')
      if (data.membershipWarning) parts.push(data.membershipWarning)
      setNotice(parts.join(' '))
      await load()
      if (data.organization?.id) await loadMembers(data.organization.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    }
  }

  const setStatus = async (id: string, status: string) => {
    setError('')
    setNotice('')
    try {
      const res = await fetch(`/api/recruitment/organizations/${id}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setNotice(`Status set to ${status}`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const loadMembers = async (orgId: string) => {
    setSelectedId(orgId)
    setMembers([])
    setJobs([])
    const [membersRes, jobsRes] = await Promise.all([
      fetch(`/api/recruitment/organizations/${orgId}/members`, { credentials: 'same-origin' }),
      fetch(`/api/recruitment/organizations/${orgId}/jobs`, { credentials: 'same-origin' }),
    ])
    const membersData = await membersRes.json()
    const jobsData = await jobsRes.json()
    if (membersRes.ok) setMembers(membersData.members ?? [])
    else setError(membersData.error || 'Failed to load members')
    if (jobsRes.ok) setJobs(jobsData.jobs ?? [])
  }

  const createJob = async () => {
    if (!selectedId) return
    setError('')
    setNotice('')
    try {
      const res = await fetch(`/api/recruitment/organizations/${selectedId}/jobs`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobTitle,
          slug: jobSlug || undefined,
          location: jobLocation,
          status: 'published',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Create job failed')
      setJobTitle('')
      setJobSlug('')
      setNotice(`Published job ${data.job.title}`)
      await loadMembers(selectedId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create job failed')
    }
  }

  const setJobStatus = async (jobId: string, status: string) => {
    if (!selectedId) return
    setError('')
    try {
      const res = await fetch(`/api/recruitment/organizations/${selectedId}/jobs`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setNotice(`Job status set to ${status}`)
      await loadMembers(selectedId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const addMember = async () => {
    if (!selectedId) return
    setError('')
    setNotice('')
    try {
      const res = await fetch(`/api/recruitment/organizations/${selectedId}/members`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: memberEmail, role: memberRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Add failed')
      setMemberEmail('')
      setNotice(
        'Hiring access granted. That person can open the employer workspace at /employer after signing in.'
      )
      await loadMembers(selectedId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add failed')
    }
  }

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Talent organizations"
        description="Review employer organization requests, activate or suspend company workspaces, and grant hiring access. Employer self-signup creates a pending request — not an active workspace."
      />

      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-4 text-sm text-slate-700 space-y-2">
          <p className="font-semibold text-slate-900">How employer access works</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Employer registers → pending organization request (or awaits company invite).</li>
            <li>Energy &amp; Logics approves new-company requests below (creates active workspace + admin).</li>
            <li>Company admins invite employees from Team — no further E&amp;L approval per employee.</li>
            <li>Suspend an organization to revoke employer workspace access immediately.</li>
          </ol>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-slate-900">Organization requests</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={requestFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setRequestFilter('pending')}
              >
                Pending
              </Button>
              <Button
                size="sm"
                variant={requestFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setRequestFilter('all')}
              >
                All history
              </Button>
            </div>
          </div>
          {requests.length === 0 ? (
            <p className="text-sm text-slate-600">No {requestFilter === 'pending' ? 'pending ' : ''}requests.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{req.company_name}</p>
                      <p className="text-xs text-slate-600">
                        {req.contact_email} · {req.request_type.replace(/_/g, ' ')} · submitted{' '}
                        {new Date(req.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className={adminStatusClass(req.status)}>
                      {req.status}
                    </Badge>
                  </div>
                  {req.status === 'pending' && req.request_type === 'new_organization' ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Review notes (optional)"
                        value={reviewNotes[req.id] ?? ''}
                        onChange={(e) =>
                          setReviewNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => void reviewRequest(req.id, 'approve')}>
                          Approve &amp; activate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void reviewRequest(req.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ) : req.status === 'pending' ? (
                    <p className="text-xs text-slate-600">
                      Waiting for a company admin invite (not platform approval).
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600">
                      {req.reviewed_at
                        ? `Reviewed ${new Date(req.reviewed_at).toLocaleString()}`
                        : null}
                      {req.review_notes ? ` · ${req.review_notes}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
      ) : null}
      {notice ? (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md p-3">
          {notice}
        </p>
      ) : null}

      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-3">
          <p className="font-semibold text-slate-900">Create company workspace + grant admin</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="org-name">Company name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. EasyFab Ltd"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="org-slug">Slug (optional)</Label>
              <Input
                id="org-slug"
                placeholder="auto from name"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="admin-email">Company admin email (must already have signed in on Talent)</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="hiring@company.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={() => void createOrg()}
            disabled={!name.trim()}
            className="bg-[var(--brand-navy)] text-white"
          >
            Create active workspace
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-600">Loading organizations…</p>
      ) : orgs.length === 0 ? (
        <p className="text-sm text-slate-600">
          No company workspaces yet. Create one above to onboard the first hiring partner.
        </p>
      ) : (
        <div className="space-y-3">
          {orgs.map((org) => (
            <Card key={org.id} className="border-slate-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{org.name}</p>
                    <p className="text-xs text-slate-600">
                      /o/{org.slug}
                      {org.notification_email ? ` · ${org.notification_email}` : ''}
                    </p>
                  </div>
                  <Badge variant="outline" className={adminStatusClass(org.status)}>
                    {org.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => void loadMembers(org.id)}>
                    Manage members & jobs
                  </Button>
                  {org.status !== 'active' ? (
                    <Button size="sm" variant="outline" onClick={() => void setStatus(org.id, 'active')}>
                      Activate
                    </Button>
                  ) : null}
                  {org.status !== 'suspended' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void setStatus(org.id, 'suspended')}
                    >
                      Suspend
                    </Button>
                  ) : null}
                  {org.status !== 'draft' ? (
                    <Button size="sm" variant="outline" onClick={() => void setStatus(org.id, 'draft')}>
                      Set draft
                    </Button>
                  ) : null}
                </div>
                {selectedId === org.id ? (
                  <div className="border-t border-slate-200 pt-3 space-y-3">
                    <p className="text-sm font-medium text-slate-800">Grant hiring access</p>
                    {members.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No members yet. Add the person who already registered on Talent.
                      </p>
                    ) : (
                      <ul className="text-sm space-y-1">
                        {members.map((m) => {
                          const u = Array.isArray(m.user) ? m.user[0] : m.user
                          return (
                            <li key={m.id} className="text-slate-700">
                              {u?.email ?? m.id} · {m.role} · {m.status}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                    <div className="grid sm:grid-cols-3 gap-2">
                      <Input
                        placeholder="user@email.com"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                      />
                      <select
                        className="rounded-md border border-slate-300 text-sm px-2"
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                      >
                        <option value="organization_admin">organization_admin</option>
                        <option value="hr_recruiter">hr_recruiter</option>
                        <option value="hiring_manager">hiring_manager</option>
                      </select>
                      <Button size="sm" onClick={() => void addMember()}>
                        Grant access
                      </Button>
                    </div>
                    <div className="border-t border-slate-200 pt-3 space-y-3">
                      <p className="text-sm font-medium text-slate-800">Jobs</p>
                      {jobs.length === 0 ? (
                        <p className="text-xs text-slate-500">No jobs yet for this organization.</p>
                      ) : (
                        <ul className="text-sm space-y-2">
                          {jobs.map((job) => (
                            <li key={job.id} className="flex flex-wrap items-center justify-between gap-2">
                              <span>
                                {job.title} · /o/{org.slug}/jobs/{job.slug} · {job.status}
                              </span>
                              {job.status === 'published' ? (
                                <Button size="sm" variant="outline" onClick={() => void setJobStatus(job.id, 'closed')}>
                                  Close
                                </Button>
                              ) : job.status !== 'archived' ? (
                                <Button size="sm" variant="outline" onClick={() => void setJobStatus(job.id, 'published')}>
                                  Publish
                                </Button>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="grid sm:grid-cols-2 gap-2">
                        <Input
                          placeholder="Job title"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                        />
                        <Input
                          placeholder="Slug (optional)"
                          value={jobSlug}
                          onChange={(e) => setJobSlug(e.target.value)}
                        />
                      </div>
                      <Input
                        placeholder="Location"
                        value={jobLocation}
                        onChange={(e) => setJobLocation(e.target.value)}
                      />
                      <Button size="sm" onClick={() => void createJob()} disabled={!jobTitle.trim()}>
                        Publish job
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
