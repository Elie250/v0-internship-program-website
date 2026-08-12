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

export default function RecruitmentOrgsManagement() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('hr_recruiter')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/recruitment/organizations', { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setOrgs(data.organizations ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createOrg = async () => {
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/recruitment/organizations', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug: slug || undefined, status: 'active' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Create failed')
      setName('')
      setSlug('')
      setNotice(`Created ${data.organization.name}`)
      await load()
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
    const res = await fetch(`/api/recruitment/organizations/${orgId}/members`, {
      credentials: 'same-origin',
    })
    const data = await res.json()
    if (res.ok) setMembers(data.members ?? [])
    else setError(data.error || 'Failed to load members')
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
      setNotice('Member added')
      await loadMembers(selectedId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add failed')
    }
  }

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Talent organizations"
        description="Multi-tenant employer organizations on Energy & Logics Talent. EasyFab (and any future employer) is ordinary organization data — never hardcoded as platform owner."
      />

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
          <p className="font-semibold text-slate-900">Create organization</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="org-name">Name</Label>
              <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
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
          </div>
          <Button
            onClick={() => void createOrg()}
            disabled={!name.trim()}
            className="bg-[var(--brand-navy)] text-white"
          >
            Create
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-600">Loading organizations…</p>
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
                    Members
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
                    <p className="text-sm font-medium text-slate-800">Members</p>
                    {members.length === 0 ? (
                      <p className="text-xs text-slate-500">No members yet.</p>
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
                        Add member
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
