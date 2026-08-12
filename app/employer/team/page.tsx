'use client'

import { useEffect, useState } from 'react'
import { EmployerShell, useEmployerOrg } from '@/components/recruitment/employer-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBanner } from '@/components/recruitment/talent-ui'

type Member = {
  id: string
  role: string
  status: string
  user?: { email?: string; first_name?: string; last_name?: string } | { email?: string }[] | null
}

function memberEmail(member: Member) {
  const user = Array.isArray(member.user) ? member.user[0] : member.user
  return user?.email ?? 'Member'
}

export default function EmployerTeamPage() {
  const { orgId, canManageTeam } = useEmployerOrg()
  const [members, setMembers] = useState<Member[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('hr_recruiter')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    if (!orgId) return
    const res = await fetch(`/api/recruitment/organizations/${orgId}/members`, { credentials: 'same-origin' })
    const data = await res.json()
    if (res.ok) setMembers(data.members ?? [])
  }

  useEffect(() => {
    void load()
  }, [orgId])

  const add = async () => {
    setError('')
    setMessage('')
    const res = await fetch(`/api/recruitment/organizations/${orgId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, role }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not add member')
    else {
      setEmail('')
      setMessage('Member added.')
      await load()
    }
  }

  const remove = async (membershipId: string) => {
    setError('')
    const res = await fetch(
      `/api/recruitment/organizations/${orgId}/members?membershipId=${membershipId}`,
      { method: 'DELETE', credentials: 'same-origin' }
    )
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not remove member')
    else await load()
  }

  return (
    <EmployerShell>
      <h1 className="text-2xl font-semibold">Team</h1>
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}
      {canManageTeam ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap gap-3 items-end">
          <Input placeholder="staff@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="max-w-xs" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="h-10 rounded-xl border px-3 text-sm">
            <option value="organization_admin">Organization admin</option>
            <option value="hr_recruiter">HR / Recruiter</option>
            <option value="hiring_manager">Hiring manager</option>
          </select>
          <Button onClick={() => void add()} className="bg-[var(--brand-navy)] text-white">
            Add member
          </Button>
        </div>
      ) : (
        <p className="text-sm text-slate-600">Hiring managers can view the team but cannot change memberships.</p>
      )}
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex justify-between gap-3">
            <div>
              <p className="font-medium">{memberEmail(member)}</p>
              <p className="text-sm text-slate-600">
                {member.role.replace(/_/g, ' ')} · {member.status}
              </p>
            </div>
            {canManageTeam ? (
              <Button variant="outline" size="sm" onClick={() => void remove(member.id)}>
                Remove
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </EmployerShell>
  )
}
