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

type Invite = {
  id: string
  email: string
  role: string
  status: string
  expires_at: string
}

function memberEmail(member: Member) {
  const user = Array.isArray(member.user) ? member.user[0] : member.user
  return user?.email ?? 'Member'
}

export default function EmployerTeamPage() {
  const { orgId, canManageTeam } = useEmployerOrg()
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('hr_recruiter')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    if (!orgId) return
    const [membersRes, invitesRes] = await Promise.all([
      fetch(`/api/recruitment/organizations/${orgId}/members`, { credentials: 'same-origin' }),
      fetch(`/api/recruitment/organizations/${orgId}/invites`, { credentials: 'same-origin' }),
    ])
    const membersData = await membersRes.json()
    if (membersRes.ok) setMembers(membersData.members ?? [])
    if (invitesRes.ok) {
      const invitesData = await invitesRes.json()
      setInvites((invitesData.invites ?? []).filter((i: Invite) => i.status === 'pending'))
    }
  }

  useEffect(() => {
    void load()
  }, [orgId])

  const invite = async () => {
    setError('')
    setMessage('')
    const res = await fetch(`/api/recruitment/organizations/${orgId}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, role }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not send invitation')
    else {
      setEmail('')
      setMessage('Invitation sent. They must accept before gaining employer access.')
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
      <p className="text-sm text-slate-600">
        Invite colleagues by email. Energy &amp; Logics does not need to approve each employee — your
        company admin controls membership. Invitees gain access only after they accept.
      </p>
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}
      {canManageTeam ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap gap-3 items-end">
          <Input
            placeholder="staff@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-10 rounded-xl border px-3 text-sm"
          >
            <option value="organization_admin">Organization admin</option>
            <option value="hr_recruiter">HR / Recruiter</option>
            <option value="hiring_manager">Hiring manager</option>
          </select>
          <Button onClick={() => void invite()} className="bg-[var(--brand-navy)] text-white">
            Send invitation
          </Button>
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          Hiring managers can view the team but cannot change memberships.
        </p>
      )}
      {invites.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-800">Pending invitations</h2>
          {invites.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4"
            >
              <p className="font-medium">{item.email}</p>
              <p className="text-sm text-slate-600">
                {item.role.replace(/_/g, ' ')} · pending · expires{' '}
                {new Date(item.expires_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-800">Active members</h2>
        {members.map((member) => (
          <div
            key={member.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 flex justify-between gap-3"
          >
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
